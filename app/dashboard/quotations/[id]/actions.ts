'use server';

import { createClient } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import { getErrorMessage } from "@/lib/errors";
import type { QuotationItemPayload } from "@/lib/quotation-items";

type ActionResult = { success: boolean; error?: string };

export async function updateQuotationStatusAction(
  id: string,
  newStatus: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { error } = await supabase
      .from('quotations')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) throw error;
    revalidatePath(`/dashboard/quotations/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}


// Bentuk hasil RPC generate_sales_order saat sukses.
type GenerateSOResult = {
  success?: boolean;
  so_id?: string;
  so_number?: string;
};

type GenerateSOPayload = {
  quotationId: string;
  poNumber: string;
  customerId: string;
  addressId: string;
  grandTotal: number;
  items: QuotationItemPayload[];
};

export async function generateSalesOrderAction(
  payload: GenerateSOPayload,
): Promise<{ success: boolean; data?: GenerateSOResult; error?: string }> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { data, error } = await supabase.rpc('generate_sales_order', {
      p_quotation_id: payload.quotationId,
      p_po_number: payload.poNumber,
      p_customer_id: payload.customerId,
      p_address_id: payload.addressId,
      p_grand_total: payload.grandTotal,
      p_items: payload.items,
    });
    if (error) throw error;
    revalidatePath(`/dashboard/quotations/${payload.quotationId}`);
    // RPC mengembalikan Json; bentuk suksesnya didokumentasikan di QuotationDetailClient
    return { success: true, data: data as unknown as GenerateSOResult };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}