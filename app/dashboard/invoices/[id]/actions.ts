'use server';

import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

type ActionResult = { success: boolean; error?: string };

function revalidateInvoiceRelatedPaths(invoiceId: string) {
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard/reports');
  revalidatePath('/dashboard');
}

export async function saveInvoiceEditsAction(
  invoiceId: string,
  payload: {
    discountAmount: number;
    grandTotal?: number; // Opsional, kita hitung ulang di server agar aman
    dueDateNote: string;
    itemNotes: Array<{ id: string; item_note: string }>;
  },
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    // 1. Cek autentikasi & status invoice saat ini
    const { data: inv, error: fetchErr } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single();

    if (fetchErr || !inv) throw new Error('Invoice tidak ditemukan.');
    if (inv.status === 'Paid' || inv.status === 'Cancelled') {
      throw new Error('Invoice yang sudah lunas atau dibatalkan tidak dapat diubah.');
    }

    // 2. Hitung ulang Subtotal resmi dari database (invoice_items)
    const { data: items, error: itemsErr } = await supabase
      .from('invoice_items')
      .select('total_price')
      .eq('invoice_id', invoiceId);

    if (itemsErr) throw itemsErr;

    const serverSubTotal = (items || []).reduce(
      (sum, item) => sum + Number(item.total_price || 0),
      0,
    );

    const validDiscount = Math.max(0, Number(payload.discountAmount || 0));
    if (validDiscount > serverSubTotal) {
      throw new Error('Nominal diskon tidak boleh melebihi subtotal invoice.');
    }

    const serverGrandTotal = serverSubTotal - validDiscount;

    // 3. Cek total pembayaran yang sudah masuk untuk menyesuaikan status
    const { data: payments } = await supabase
      .from('payments')
      .select('amount_paid')
      .eq('invoice_id', invoiceId);

    const totalPaid = (payments || []).reduce(
      (sum, p) => sum + Number(p.amount_paid || 0),
      0,
    );

    let newStatus = 'Unpaid';
    if (totalPaid >= serverGrandTotal && serverGrandTotal > 0) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partial';
    }

    // 4. Update header invoice dengan nilai yang sudah tervalidasi
    const { error: invErr } = await supabase
      .from('invoices')
      .update({
        discount_amount: validDiscount,
        grand_total: serverGrandTotal,
        due_date_note: payload.dueDateNote,
        amount_paid: totalPaid,
        status: newStatus,
      })
      .eq('id', invoiceId);

    if (invErr) throw invErr;

    // 5. Update catatan per item (pastikan hanya item milik invoice ini)
    if (payload.itemNotes && payload.itemNotes.length > 0) {
      const results = await Promise.all(
        payload.itemNotes.map((note) =>
          supabase
            .from('invoice_items')
            .update({ item_note: note.item_note })
            .eq('id', note.id)
            .eq('invoice_id', invoiceId), // Pengaman tambahan agar tidak salah update invoice lain
        ),
      );

      const failed = results.find((res) => res.error);
      if (failed?.error) {
        return {
          success: false,
          error: 'Diskon tersimpan, tetapi sebagian catatan item gagal diperbarui.',
        };
      };
    }

    revalidateInvoiceRelatedPaths(invoiceId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recordPaymentAction(
  invoiceId: string,
  payload: {
    amountPaid: number;
    paymentDate: string;
    referenceNumber: string | null;
    paymentProofUrl?: string | null;
  },
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    // 1. Validasi Role di sisi Server (Hanya 'atasan' yang boleh mencatat pembayaran)
    const { data: role } = await supabase.rpc('get_user_role');
    if (role?.toLowerCase() !== 'atasan') {
      throw new Error('Akses ditolak: Hanya Atasan yang dapat mencatat pembayaran.');
    }

    if (!payload.amountPaid || payload.amountPaid <= 0) {
      throw new Error('Nominal pembayaran harus lebih dari 0.');
    }

    // 2. Validasi sisa tagihan di sisi Server (Mencegah kelebihan bayar / double submit)
    const [{ data: inv }, { data: existingPayments }] = await Promise.all([
      supabase
        .from('invoices')
        .select('grand_total, status')
        .eq('id', invoiceId)
        .single(),
      supabase
        .from('payments')
        .select('amount_paid')
        .eq('invoice_id', invoiceId),
    ]);

    if (!inv) throw new Error('Invoice tidak ditemukan.');
    if (inv.status === 'Cancelled') {
      throw new Error('Tidak dapat mencatat pembayaran pada invoice yang dibatalkan.');
    }

    const currentPaid = (existingPayments || []).reduce(
      (sum, p) => sum + Number(p.amount_paid || 0),
      0,
    );
    const balanceDue = Number(inv.grand_total || 0) - currentPaid;

    if (payload.amountPaid > balanceDue) {
      throw new Error(
        `Nominal melebihi sisa tagihan (Maksimal: Rp ${balanceDue.toLocaleString('id-ID')}).`,
      );
    }

    // 3. Insert ke tabel payments (Trigger DB akan mengupdate status invoice)
    const { error } = await supabase.from('payments').insert({
      invoice_id: invoiceId,
      amount_paid: payload.amountPaid,
      payment_date: payload.paymentDate,
      payment_method: 'Transfer Bank',
      reference_number: payload.referenceNumber,
      payment_proof_url: payload.paymentProofUrl || null,
    });
    if (error) throw error;

    // 4. Sinkronkan kolom amount_paid di tabel invoices
    await supabase
      .from('invoices')
      .update({ amount_paid: currentPaid + payload.amountPaid })
      .eq('id', invoiceId);

    revalidateInvoiceRelatedPaths(invoiceId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelInvoiceAction(
  invoiceId: string,
  reason: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    if (!reason || !reason.trim()) {
      throw new Error('Alasan pembatalan wajib diisi.');
    }

    const { error } = await supabase.rpc('cancel_invoice', {
      p_invoice_id: invoiceId,
      p_reason: reason.trim(),
    });
    if (error) throw error;

    revalidateInvoiceRelatedPaths(invoiceId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoiceAddressAction(
  invoiceID: string,
  newAddressID: string
){
  try{
    const supabase = await createClient();
    //Update address_id di table invoices
    const{error} = await supabase
    .from('invoices')
    .update({address_id: newAddressID})
    .eq('id', invoiceID); 

    if(error) throw new Error(error.message);
    revalidateInvoiceRelatedPaths(invoiceID);
    return {success: true};
  } catch (error: any) {
    console.error("Gagal update alamat invoice:", error);
    return {success: false, error: error.message};
  }
}