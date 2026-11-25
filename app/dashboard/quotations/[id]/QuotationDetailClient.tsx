"use client";
import { useState } from "react";
import Link from "next/link";
import {
  updateQuotationStatusAction,
  generateSalesOrderAction,
} from "./actions";
import { getErrorMessage } from "@/lib/errors";
import type { Tables } from "@/lib/database.types";
import QuotationPrintSheet from "./QuotationPrintSheet";

/* ─── Konfigurasi Pagination Pintar ─── */
export const ROWS_FULL_PAGE = 12; // Kapasitas halaman penuh (tanpa Total, Note & TTD)
export const ROWS_LAST_PAGE = 8;  // Kapasitas halaman terakhir (dengan Total, Note & TTD)

function paginateItems<T>(list: T[]): T[][] {
  if (list.length === 0) return [[]];
  if (list.length <= ROWS_LAST_PAGE) return [list];

  const result: T[][] = [];
  let remaining = [...list];

  while (remaining.length > 0) {
    if (remaining.length <= ROWS_LAST_PAGE) {
      result.push(remaining);
      break;
    }
    // Jika sisa item tanggung (misal 9 - 12 item), sisakan 2 item untuk halaman berikutnya
    // agar halaman terakhir tidak hanya berisi Total & Tanda Tangan sendirian
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


export type QuotationItemWithProduct = Tables<"quotation_items"> & {
  products: Tables<"products"> | null;
};

type ExistingSO = Pick<Tables<"sales_orders">, "id" | "so_number">;

type QuotationDetailClientProps = {
  id: string;
  initialQuotation: Tables<"quotations">;
  customer: Tables<"customers"> | null;
  address: Tables<"customer_addresses"> | null;
  items: QuotationItemWithProduct[];
  initialExistingSO: ExistingSO | null;
};

export default function QuotationDetailClient({
  id,
  initialQuotation,
  customer,
  address,
  items,
  initialExistingSO,
}: QuotationDetailClientProps) {
  const [quotation, setQuotation] = useState<Tables<"quotations">>(initialQuotation);
  const [existingSO, setExistingSO] = useState<ExistingSO | null>(initialExistingSO);

  const subTotal = (items || []).reduce(
    (sum: number, i) => sum + (i.total_price || 0),
    0,
  );
  const discountAmount = Math.max(
    0,
    Math.round(subTotal - (initialQuotation?.grand_total || 0)),
  );

  const [isCreatingSO, setIsCreatingSO] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poInput, setPoInput] = useState("");

  const handleUpdateStatus = async (newStatus: string) => {
    if (existingSO) {
      alert("Dokumen ini sudah terkunci karena Sales Order telah diterbitkan.");
      return;
    }
    const res = await updateQuotationStatusAction(id, newStatus);
    if (res.success) setQuotation({ ...quotation, status: newStatus });
  };

  const handlePrint = () => {
    window.print();
    if (quotation.status === "Draft") {
      handleUpdateStatus("Sent");
    }
  };


  const handleCreateSO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poInput.trim()) {
      alert("Nomor PO dari klien wajib diisi!");
      return;
    }
    setIsCreatingSO(true);
    try {
      const itemsPayload = items.map((i) => ({
        product_id: i.product_id,
        qty: i.qty,
        unit_price: i.unit_price,
        discount: i.discount || 0,
        total_price: i.total_price || 0,
      }));
      const res = await generateSalesOrderAction({
        quotationId: id,
        poNumber: poInput.trim(),
        customerId: quotation.customer_id,
        addressId: quotation.address_id,
        grandTotal: quotation.grand_total ?? 0,
        items: itemsPayload,
      });
      if (!res.success) throw new Error(res.error);
      const rpcResult = res.data;
      if (rpcResult && rpcResult.success && rpcResult.so_id && rpcResult.so_number) {
        alert(
          `Sukses! Dokumen Sales Order ${rpcResult.so_number} berhasil diterbitkan.`,
        );
        setExistingSO({ id: rpcResult.so_id, so_number: rpcResult.so_number });
        setIsPOModalOpen(false);
      } else {
        throw new Error(
          "Respons database tidak sesuai atau gagal memproses SO.",
        );
      }
    } catch (error) {
      console.error(error);
      alert(`Gagal membuat SO: ${getErrorMessage(error)}`);
    } finally {
      setIsCreatingSO(false);
    }
  };

  const isLocked = !!existingSO;
  const pages = paginateItems(items || []);
  const totalPages = pages.length;

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 pb-10 print:m-0 print:p-0 print:space-y-0 print:max-w-none text-black relative">
      {/* ── KONTROL UI ── */}
      <div className="print:hidden w-full max-w-[210mm] mx-auto card-modern p-5 md:p-6 border-l-4 border-l-blue-500 animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
        <div className="doc-header-row">
          {/* --- KIRI: TOMBOL KEMBALI & STATUS --- */}
          <div className="flex flex-row items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/dashboard/quotations"
              title="Kembali ke daftar penawaran"
              aria-label="Kembali ke daftar penawaran"
              className="inline-flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors border border-slate-200 shrink-0"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Status Dokumen
              </span>
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <div
                    title="Terkunci karena Sales Order sudah terbit"
                    className="bg-slate-100 text-slate-500 border border-slate-200 rounded-lg h-10 sm:h-auto px-2.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed shrink-0"
                  >
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span className="truncate">Terkunci</span>
                    <span className="hidden sm:inline">(SO Terbit)</span>
                  </div>
                ) : (
                  <div
                    title="Status dokumen"
                    className={`h-10 sm:h-auto px-2.5 sm:px-3 sm:py-1.5 border-2 rounded-lg font-black uppercase tracking-wider text-[10px] sm:text-xs flex items-center justify-center text-center sm:text-left
                      ${
                        quotation.status === "Draft"
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : quotation.status === "Sent"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : quotation.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-rose-100 text-rose-700 border-rose-200"
                      }`}
                  >
                    {quotation.status === "Draft" && "Draft (Belum Fix)"}
                    {quotation.status === "Sent" && "Dikirim (Sent)"}
                    {quotation.status === "Approved" && "Disetujui (Approved)"}
                    {quotation.status === "Rejected" && "Ditolak (Rejected)"}
                  </div>
                )}
                {!isLocked && quotation.status === "Sent" && (
                  <button
                    onClick={() => handleUpdateStatus("Approved")}
                    title="Tandai Disetujui"
                    aria-label="Tandai Disetujui"
                    className="h-10 sm:h-auto px-2.5 sm:px-3 sm:py-1.5 rounded-lg font-black uppercase tracking-wider text-[10px] sm:text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                  >
                    Disetujui
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* --- KANAN: TOMBOL AKSI (REVISI / BUAT SO / PRINT) --- */}
          <div className="flex flex-row items-center sm:items-end gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Link
                  href={`/dashboard/sales-orders/${existingSO?.id}`}
                  title="Lihat Dokumen SO"
                  aria-label="Lihat Dokumen SO"
                  className="btn-icon-mobile inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white sm:py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  <svg
                    className="w-5 h-5 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="btn-label">Lihat Dokumen SO</span>
                </Link>
              ) : (
                <>
                  {quotation.status === "Approved" && (
                    <button
                      onClick={() => setIsPOModalOpen(true)}
                      title="Buat Sales Order"
                      aria-label="Buat Sales Order"
                      className="btn-icon-mobile inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white sm:py-2 rounded-xl font-bold text-sm transition-colors shadow-emerald-600/30 shadow-lg"
                    >
                      <svg
                        className="w-5 h-5 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="btn-label">Buat SO</span>
                    </button>
                  )}
                  {quotation.status !== "Approved" && (
                    <Link
                      href={`/dashboard/quotations/${id}/edit`}
                      title="Revisi Penawaran"
                      aria-label="Revisi Penawaran"
                      className="btn-icon-mobile inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white sm:py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                      <svg
                        className="w-5 h-5 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <span className="btn-label">Revisi</span>
                    </Link>
                  )}
                </>
              )}
            </div>
            <button
              onClick={handlePrint}
              title="Cetak PDF"
              aria-label="Cetak PDF"
              className="btn-icon-mobile inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white sm:py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
            >
              <svg
                className="w-5 h-5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0-12V5a2 2 0 012-2h2a2 2 0 012 2v4H9z"
                />
              </svg>
              <span className="btn-label">Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>

      <QuotationPrintSheet
        quotation={quotation}
        customer={customer}
        address={address}
        pages={pages}
        totalPages={totalPages}
        subTotal={subTotal}
        discountAmount={discountAmount}
      />

      {/* ── MODAL CONVERT KE SALES ORDER ── */}
      {isPOModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center p-4 print:hidden items-end sm:items-center sm:p-6 overflow-y-auto">
          <form
            onSubmit={handleCreateSO}
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col my-auto animate-in slide-in-from-bottom-10 sm:scale-in-center duration-300"
          >
            <div className="shrink-0 bg-blue-600 p-5 text-white flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-xl font-black">Convert ke Sales Order</h2>
                <p className="text-blue-100 text-xs font-mono mt-0.5">
                  {quotation.quotation_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center border border-blue-200 shadow-inner">
                <span className="text-xs font-bold block mb-1">
                  Quotation ini akan diubah menjadi Dokumen Sales Order resmi.
                </span>
              </div>
              <div>
                <label className="label-modern text-blue-900">
                  Nomor PO (Purchase Order) Klien *
                </label>
                <div className="mt-1 relative">
                  <span className="absolute left-4 top-3 font-bold text-slate-400">
                    PO-
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Misal: 025/PAMA/2026"
                    value={poInput}
                    onChange={(e) => setPoInput(e.target.value)}
                    className="input-modern pl-12 text-sm font-bold text-blue-900 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  * Nomor PO ini akan menjadi referensi utama di dokumen Sales
                  Order dan Invoice nantinya.
                </p>
              </div>
            </div>
            <div className="shrink-0 p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCreatingSO}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm disabled:bg-blue-300 transition-colors"
              >
                {isCreatingSO ? "Memproses..." : "Buat Sales Order"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
