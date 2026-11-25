"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase'; 
import Link from "next/link";
import { useToast } from "@/components/ui/Alert";
import Modal from "@/components/ui/Modal";
import Image from "next/image";
import {
  saveInvoiceEditsAction,
  recordPaymentAction,
  cancelInvoiceAction,
  updateInvoiceAddressAction,
} from "./actions";
import { getErrorMessage } from "@/lib/errors";
import type { Tables } from "@/lib/database.types";
import { fmtDateGB } from "@/lib/format";
import InvoicePrintSheets from "./InvoicePrintSheets";

export type InvoiceDetailItem = {
  id: string;
  product_id: string | null;
  products: Pick<Tables<"products">, "part_code" | "part_name" | "unit" | "remark"> | null;
  qty: number;
  invoice_item_id: string;
  qty_billed: number;
  unit_price: number;
  discount: number;
  total_price: number;
  item_note: string;
};

type InvoiceDetailClientProps = {
  invoice: Tables<"invoices">;
  salesOrder: Tables<"sales_orders"> | null;
  customer: Tables<"customers"> | null;
  billingAddress: Tables<"customer_addresses"> | null;
  items: InvoiceDetailItem[];
  paymentsHistory: Tables<"payments">[];
  allAddresses: Pick<
    Tables<"customer_addresses">,
    "id" | "address_type" | "complete_address" | "pic_name" | "pic_phone"
  >[];
};

// Kapasitas baris untuk halaman penuh (tanpa TTD) vs halaman terakhir (dengan Total + TTD)
export const ROWS_FULL_PAGE = 11; 
export const ROWS_LAST_PAGE = 7; 

function paginateItems<T>(list: T[]): T[][] {
  if (list.length === 0) return [[]];
  if (list.length <= ROWS_LAST_PAGE) return [list];

  const result: T[][] = [];
  let remaining = [...list];

  while (remaining.length > 0) {
    // Jika sisa item muat di halaman terakhir (<= 7 item), masukkan semuanya
    if (remaining.length <= ROWS_LAST_PAGE) {
      result.push(remaining);
      break;
    }
    // Jika sisa item tanggung (misal 8, 9, 10, atau 11 item):
    // Jangan habiskan semua di halaman ini agar halaman berikutnya tidak cuma berisi TTD kosong!
    // Ambil sebagian sehingga minimal ada 2 item yang ikut menemani Total & TTD di halaman berikutnya.
    if (remaining.length <= ROWS_FULL_PAGE) {
      const takeCount = remaining.length - 2;
      result.push(remaining.slice(0, takeCount));
      remaining = remaining.slice(takeCount);
    } else {
      result.push(remaining.slice(0, ROWS_FULL_PAGE));
      remaining = remaining.slice(ROWS_FULL_PAGE);
    }
  }
  return result;
}

// Fungsi mengubah angka menjadi kalimat Terbilang Bahasa Indonesia

export default function InvoiceDetailClient({
  invoice,
  salesOrder,
  customer,
  billingAddress,
  items,
  paymentsHistory,
  allAddresses,
}: InvoiceDetailClientProps) {
  const router = useRouter();
  const id = invoice.id;

  // ... state lainnya seperti printMode, isPaymentModalOpen, dll
  const [francoTerm, setFrancoTerm] = useState("Franco Jakarta"); // Default kita ubah ke permintaan cust saat ini

   const [userRole, setUserRole] = useState<string | null>(null);
  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (profileData?.role) setUserRole(profileData.role.toLowerCase());
    };
    fetchRole();
  }, []);

  const canEditDiscount = userRole === "admin";
  const canPrint = userRole === "admin" || userRole === "atasan";
  const canRecordPayment = userRole === "atasan";
  const canCancelInvoice = userRole === "admin" || userRole === "atasan";

  const toast = useToast();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payRef, setPayRef] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountDraft, setDiscountDraft] = useState<number>(0);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const [discountInput, setDiscountInput] = useState<number>(
    invoice.discount_amount || 0,
  );
  const [invoiceNote, setInvoiceNote] = useState(
    invoice.due_date_note ||
      "Pembayaran ditransfer ke rekening:\nBank MANDIRI No. 1560024959530\na.n HARMONISINDO JAYA PART",
  );
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    items.forEach((it) => {
      const targetId = it.invoice_item_id || it.id;
      init[targetId] = it.item_note || "";
    });
    return init;
  });
  const [isSavingAll, setIsSavingAll] = useState(false);

  const invoiceDateSource = invoice?.created_at || new Date().toISOString();
  const todayFormatted = new Date(invoiceDateSource).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const subTotal = items.reduce(
    (sum, item) =>
      sum + (item.total_price ?? (item.qty_billed ?? item.qty ?? 0) * (item.unit_price ?? 0)),
    0,
  );
  const grandTotal = subTotal - discountInput;
  const totalPaid = paymentsHistory.reduce(
    (sum, p) => sum + (p.amount_paid || 0),
    0,
  );
  const balanceDue = grandTotal - totalPaid;

  const isPaid = invoice?.status?.toLowerCase() === "paid";
  const isCancelled =
    invoice?.status?.toLowerCase() === "cancelled" ||
    invoice?.status?.toLowerCase() === "canceled";
  const isOverdue =
    new Date(invoice?.due_date) < new Date() && !isPaid && !isCancelled;
  const isEditable = !isPaid && !isCancelled;

  const handleSaveEdits = async (overrideDiscount?: number) => {
    if (!canEditDiscount || !isEditable) return;
    const discountToSave =
      typeof overrideDiscount === "number" ? overrideDiscount : discountInput;
    setIsSavingAll(true);
    try {
      const noteUpdates = items
        .filter((it) => it.invoice_item_id)
        .map((it) => ({
          id: it.invoice_item_id,
          item_note: itemNotes[it.invoice_item_id] || "",
        }));
      const res = await saveInvoiceEditsAction(id, {
        discountAmount: discountToSave,
        grandTotal: subTotal - discountToSave,
        dueDateNote: invoiceNote,
        itemNotes: noteUpdates,
      });
      if (!res.success) throw new Error(res.error);
      setDiscountInput(discountToSave);
      setIsDiscountModalOpen(false);
      toast.success("Diskon dan Catatan berhasil disimpan!", "Success");
      router.refresh();
    } catch (error) {
      toast.error(`Gagal menyimpan: ${getErrorMessage(error)}`, "Error");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRecordPayment || isCancelled) return;
    if (payAmount <= 0) return toast.error("Nominal harus lebih dari 0", "Error");
    if (payAmount > balanceDue)
      return toast.error(
        `Nominal melebihi sisa tagihan! Maksimal: Rp ${balanceDue.toLocaleString("id-ID")}`,
        "Error",
      );
    setIsSubmittingPayment(true);
    try {
      if (paymentProofFile) {
        console.log("File siap di-upload:", paymentProofFile.name);
      }
      const res = await recordPaymentAction(id, {
        amountPaid: payAmount,
        paymentDate: payDate,
        referenceNumber: payRef || null,
      });
      if (!res.success) throw new Error(res.error);
      toast.success("Pembayaran berhasil dicatat!", "Success");
      setIsPaymentModalOpen(false);
      setPayAmount(0);
      setPayRef("");
      setPaymentProofFile(null);
      router.refresh();
    } catch (error) {
      toast.error(`Gagal mencatat pembayaran: ${getErrorMessage(error)}`, "Error");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCancelInvoice) return;
    if (!cancelReason.trim())
      return toast.error("Alasan pembatalan wajib diisi!", "Error");
    setIsSubmittingCancel(true);
    try {
      const res = await cancelInvoiceAction(id, cancelReason);
      if (!res.success) throw new Error(res.error);
      toast.success("Invoice berhasil dibatalkan!", "Success");
      setIsCancelModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(`Gagal membatalkan invoice: ${getErrorMessage(error)}`, "Error");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handlePrint = () => window.print();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(invoice?.address_id || "");
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAddress(true);
    try{
      const res = await updateInvoiceAddressAction(invoice.id, selectedAddressId);
      if (res.success){
        setIsAddressModalOpen(false);
      } else{
        alert(`Gagal : ${res.error}`);
      }
    }catch (error) {
      alert(`Gagal : ${getErrorMessage(error)}`);
    } finally {
      setIsUpdatingAddress(false);
    }
  }; 

  const [printMode, setPrintMode] = useState<'invoice' | 'non_pkp' | 'both'>('invoice');



  // ==== Pecah item jadi halaman ====
  const pages = paginateItems(items);
  const totalPages = pages.length;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-10 print:m-0 print:p-0 print:max-w-none text-black relative">
      {/* ── PANEL KONTROL ADMIN (tetap sekali, di luar loop) ── */}
      <div className="print:hidden w-full max-w-[210mm] mx-auto card-modern overflow-visible p-5 md:p-6 border-l-4 border-l-purple-500 animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* ── BAGIAN KIRI: BACK BUTTON & STATUS ── */}
          <div className="flex flex-row items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/dashboard/invoices"
              title="Kembali ke daftar invoice"
              className="inline-flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors border border-slate-200 shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="min-w-0">
              <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Status Dokumen
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {isCancelled ? (
                  <span className="bg-rose-100 text-rose-800 border-rose-200 border px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    DIBATALKAN
                  </span>
                ) : isPaid ? (
                  <span className="badge-success whitespace-nowrap">LUNAS</span>
                ) : invoice?.status === "Partial" ? (
                  <span className="bg-blue-100 text-blue-700 border-blue-200 border px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    PARSIAL
                  </span>
                ) : (
                  <span className="badge-danger whitespace-nowrap">
                    BELUM BAYAR
                  </span>
                )}
                {isOverdue && (
                  <span className="text-[10px] text-white bg-rose-600 px-2 py-1 rounded font-black uppercase animate-pulse shadow-sm">
                    OVERDUE!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── BAGIAN KANAN: KONTROL CETAK & AKSI ── */}
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            
            {canRecordPayment && !isPaid && !isCancelled && (
              <button
                onClick={() => {
                  setPayAmount(balanceDue);
                  setIsPaymentModalOpen(true);
                }}
                className="btn-icon-mobile inline-flex items-center justify-center h-10 sm:h-[42px] px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-600/25 shrink-0"
              >
                <svg className="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Bayar</span>
              </button>
            )}

            {/* SAKLAR DROPDOWN (Menghemat Ruang Secara Signifikan) */}
            <select
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as 'invoice' | 'non_pkp' | 'both')}
              className="h-10 sm:h-[42px] bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 outline-none focus:border-purple-500 cursor-pointer shadow-sm flex-1 sm:flex-none min-w-[140px]"
            >
              <option value="invoice">📄 Mode: Invoice</option>
              <option value="non_pkp">📝 Mode: Non-PKP</option>
              <option value="both">📑 Cetak Semua</option>
            </select>

             {/* SAKLAR FRANCO (Khusus Admin untuk ganti teks sebelum cetak) */}
            {userRole === "admin" && (
              <select
                value={francoTerm}
                onChange={(e) => setFrancoTerm(e.target.value)}
                title="Ubah teks Franco di Invoice"
                className="h-10 sm:h-[42px] bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl px-2 outline-none focus:border-amber-500 cursor-pointer shadow-sm shrink-0"
              >
                <option value="Franco Site">Franco Site</option>
                <option value="Franco Jakarta">Franco Jakarta</option>
                <option value="Franco GTS">Franco GTS</option>
              </select>
            )}

            {canPrint && (
              <button
                onClick={handlePrint}
                className="btn-icon-mobile inline-flex items-center justify-center h-10 sm:h-[42px] px-3 sm:px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-600/25 shrink-0"
              >
                <svg className="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0-12V5a2 2 0 012-2h2a2 2 0 012 2v4H9z" />
                </svg>
                <span className="hidden sm:inline">Cetak PDF</span>
              </button>
            )}

            {(canCancelInvoice || canEditDiscount) && !isPaid && !isCancelled && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setIsActionMenuOpen((v) => !v)}
                  className="inline-flex items-center justify-center h-10 w-10 sm:h-[42px] sm:w-[42px] bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.6" />
                    <circle cx="12" cy="12" r="1.6" />
                    <circle cx="12" cy="19" r="1.6" />
                  </svg>
                </button>
                {isActionMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsActionMenuOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {canEditDiscount && isEditable && (
                        <>
                          <button
                            onClick={() => {
                              setIsActionMenuOpen(false);
                              setDiscountDraft(discountInput);
                              setIsDiscountModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Ubah Diskon
                          </button>
                          {canCancelInvoice && (
                            <div className="my-1 border-t border-slate-100" />
                          )}
                        </>
                      )}
                      {canCancelInvoice && (
                        <button
                          onClick={() => {
                            setIsActionMenuOpen(false);
                            setIsCancelModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Batalkan Invoice
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {userRole === "admin" && !isPaid && !isCancelled && (
          <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pencatatan pembayaran hanya dapat dilakukan oleh Atasan.
          </p>
        )}
      </div>

      {/* ── WRAPPER SEMUA HALAMAN ── */}
      <div className="w-full overflow-x-auto pb-6 custom-scrollbar print:overflow-visible print:pb-0 relative">
        <div className="w-full overflow-x-auto pb-8 custom-scrollbar print:overflow-visible print:pb-0 relative">
          <InvoicePrintSheets
            printMode={printMode}
            invoice={invoice}
            salesOrder={salesOrder}
            customer={customer}
            billingAddress={billingAddress}
            pages={pages}
            totalPages={totalPages}
            subTotal={subTotal}
            grandTotal={grandTotal}
            discountInput={discountInput}
            invoiceNote={invoiceNote}
            itemNotes={itemNotes}
            todayFormatted={todayFormatted}
            isCancelled={isCancelled}
            isPaid={isPaid}
            isEditable={isEditable}
            francoTerm={francoTerm}
            onEditAddress={() => setIsAddressModalOpen(true)}
            onInvoiceNoteChange={setInvoiceNote}
            onItemNotesChange={setItemNotes}
          />
        </div>
      </div>

      {/* ── RIWAYAT PEMBAYARAN (sekali, di luar loop) ── */}
      {paymentsHistory.length > 0 && (
        <div className="print:hidden w-full max-w-[210mm] mx-auto bg-white border border-slate-300 shadow-sm mt-6 p-6 sm:p-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-800 pb-2 mb-4 tracking-wider">
            Riwayat Pembayaran (Payment History)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50">
                  <th className="py-2.5 px-3 font-bold text-slate-700 uppercase">Tanggal</th>
                  <th className="py-2.5 px-3 font-bold text-slate-700 uppercase">Metode / Ref</th>
                  <th className="py-2.5 px-3 font-bold text-slate-700 uppercase text-center">Bukti</th>
                  <th className="py-2.5 px-3 font-bold text-slate-700 uppercase text-right">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paymentsHistory.map((pay, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-800 whitespace-nowrap">{fmtDateGB(pay.payment_date)}</td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {pay.payment_method || "Transfer"}
                      {pay.reference_number ? ` (Ref: ${pay.reference_number})` : ""}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">
                      {pay.payment_proof_url ? (
                        <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          Terlampir
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {pay.amount_paid.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right font-bold text-slate-800 uppercase">Total Dibayar:</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">Rp {totalPaid.toLocaleString("id-ID")}</td>
                </tr>
                {!isPaid && !isCancelled && (
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right font-bold text-slate-600 uppercase">Sisa Piutang:</td>
                    <td className="py-2 px-3 text-right font-bold text-rose-600">Rp {balanceDue.toLocaleString("id-ID")}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL PEMBAYARAN (tak berubah) ── */}
      {isPaymentModalOpen && canRecordPayment && !isCancelled && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center p-4 print:hidden items-end sm:items-center sm:p-6 overflow-y-auto">
          <form onSubmit={handlePaymentSubmit} className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] my-auto animate-in slide-in-from-bottom-10 sm:scale-in-center duration-300">
            <div className="shrink-0 bg-emerald-600 p-5 text-white flex justify-between items-center rounded-t-2xl sm:rounded-t-2xl">
              <div>
                <h2 className="text-xl font-black">Catat Uang Masuk</h2>
                <p className="text-emerald-100 text-xs font-mono mt-0.5">{invoice?.invoice_number}</p>
              </div>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="text-emerald-200 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-2 rounded-lg transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-center border border-amber-200 shadow-inner">
                <span className="label-modern justify-center mb-1 text-amber-700/60">Sisa Tagihan (Piutang)</span>
                <span className="text-2xl font-black">Rp {balanceDue.toLocaleString("id-ID")}</span>
              </div>
              <div>
                <label className="label-modern">Nominal Transfer (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 font-black text-slate-400">Rp</span>
                  <input type="number" max={balanceDue} required value={payAmount === 0 ? "" : payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="input-modern pl-12 text-lg font-black text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-modern">Tanggal Transfer</label>
                  <input type="date" required value={payDate} onChange={(e) => setPayDate(e.target.value)} className="input-modern" />
                </div>
                <div>
                  <label className="label-modern">No. Referensi Bank</label>
                  <input type="text" placeholder="Mis: TRF-BCA-01" value={payRef} onChange={(e) => setPayRef(e.target.value)} className="input-modern" />
                </div>
              </div>
              <div>
                <label className="label-modern">Upload Bukti Transfer (Opsional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-colors cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-bold text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                        <span>Pilih Gambar</span>
                        <input type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Maks 2MB</p>
                  </div>
                  {paymentProofFile && (
                    <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center p-4">
                      <span className="text-3xl mb-2">📸</span>
                      <span className="text-xs font-black text-emerald-700 truncate w-full text-center">{paymentProofFile.name}</span>
                      <button type="button" onClick={(e) => { e.preventDefault(); setPaymentProofFile(null); }} className="text-[10px] text-rose-500 font-bold uppercase mt-2 hover:underline">Hapus File</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0 p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl sm:rounded-b-2xl">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary">Batal</button>
              <button type="submit" disabled={isSubmittingPayment} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm disabled:bg-emerald-300 transition-colors">
                {isSubmittingPayment ? "Memproses..." : "Simpan Uang Masuk"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL UBAH ALAMAT (Memakai Reusable Component) ── */}
      <Modal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)}
        title="Ubah Alamat Tagihan (PIC)"
      >
        <form onSubmit={handleUpdateAddress} className="flex flex-col gap-4 p-2">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Pilih Alamat & Kontak:
            </label>
            <select
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="input-modern w-full"
            >
              {allAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.address_type} - {addr.pic_name} ({addr.pic_phone})
                </option>
              ))}
            </select>
          </div>
          
          {/* Preview Alamat Lengkap */}
          <div className="p-3 bg-slate-50 border rounded text-xs text-slate-600">
            <span className="font-bold">Alamat Lengkap:</span><br/>
            {allAddresses.find(a => a.id === selectedAddressId)?.complete_address}
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUpdatingAddress}
              className="btn-icon-mobile inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white sm:py-2 px-4 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {isUpdatingAddress ? "Menyimpan..." : "Simpan Alamat"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL UBAH DISKON (pakai komponen Modal) ── */}
      <Modal
        isOpen={isDiscountModalOpen && canEditDiscount && isEditable}
        onClose={() => setIsDiscountModalOpen(false)}
        title="Ubah Diskon Invoice"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSavingAll || discountDraft < 0 || discountDraft > subTotal}
              onClick={() => handleSaveEdits(discountDraft)}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingAll ? "Menyimpan..." : "Simpan Diskon"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Diskon dipotong dari subtotal invoice{" "}
            <strong className="text-slate-700">{invoice?.invoice_number}</strong>.
            Perubahan langsung memengaruhi Grand Total dan sisa tagihan.
          </p>

          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Subtotal
            </span>
            <span className="text-sm font-black text-slate-800">
              Rp {subTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <div>
            <label className="label-modern">Nominal Diskon (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 font-black text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min={0}
                max={subTotal}
                inputMode="numeric"
                value={discountDraft === 0 ? "" : discountDraft}
                onChange={(e) => setDiscountDraft(Number(e.target.value))}
                placeholder="0"
                className="input-modern pl-12 text-lg font-black text-rose-600 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
            {discountDraft > subTotal && (
              <p className="mt-1.5 text-[11px] font-bold text-rose-600">
                Diskon tidak boleh melebihi subtotal.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-500">
              Grand Total Baru
            </span>
            <span className="text-lg font-black text-purple-700">
              Rp {Math.max(0, subTotal - discountDraft).toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </Modal>

      {/* ── MODAL PEMBATALAN (tak berubah) ── */}
      {isCancelModalOpen && canCancelInvoice && !isCancelled && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex justify-center p-4 print:hidden items-center overflow-y-auto">
          <form onSubmit={handleCancelSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-300">
            <div className="shrink-0 bg-rose-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Batalkan Invoice
                </h2>
                <p className="text-rose-100 text-xs mt-0.5">{invoice?.invoice_number}</p>
              </div>
              <button type="button" onClick={() => setIsCancelModalOpen(false)} className="text-rose-200 hover:text-white bg-rose-700/50 hover:bg-rose-700 p-2 rounded-lg transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-slate-600 leading-relaxed">
                Tindakan ini <strong className="text-rose-600">tidak dapat dibatalkan</strong>. Invoice yang dibatalkan tidak akan dihitung ke dalam laporan KPI dan target pendapatan perusahaan.
              </p>
              <div>
                <label className="label-modern font-bold text-slate-800">
                  Alasan Pembatalan <span className="text-rose-500">*</span>
                </label>
                <textarea required rows={4} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Berikan alasan detail (contoh: Salah input harga, retur barang, dll)" className="input-modern mt-1 resize-none" />
              </div>
            </div>
            <div className="shrink-0 p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setIsCancelModalOpen(false)} className="btn-secondary">Kembali</button>
              <button type="submit" disabled={isSubmittingCancel} className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm disabled:bg-rose-300 transition-colors">
                {isSubmittingCancel ? "Memproses..." : "Ya, Batalkan Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
