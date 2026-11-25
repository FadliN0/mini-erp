"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Alert";
import {
  updateSalesOrderStatusAction,
  createInvoiceFromSoAction,
} from "./actions";
import { getErrorMessage } from "@/lib/errors";
import type { Tables } from "@/lib/database.types";
import SalesOrderPrintSheet from "./SalesOrderPrintSheet";

export type SalesOrderItemWithProduct = Tables<"sales_order_items"> & {
  products: Pick<Tables<"products">, "part_code" | "part_name" | "unit" | "remark"> | null;
};

export default function SalesOrderDetailClient({
  salesOrder: initialSalesOrder,
  customer,
  address,
  items,
  hasDO,
  hasInvoice,
}: {
  salesOrder: Tables<"sales_orders">;
  customer: Tables<"customers"> | null;
  address: Tables<"customer_addresses"> | null;
  items: SalesOrderItemWithProduct[];
  hasDO: boolean;
  hasInvoice: boolean;
}) {
  const router = useRouter();
  const [salesOrder, setSalesOrder] = useState<Tables<"sales_orders">>(initialSalesOrder);
  const toast = useToast();
  const [isCreatingInvoice, startInvoiceTransition] = useTransition();
  const [isUpdatingStatus, startStatusTransition] = useTransition();
  const handlePrint = () => window.print();
  const handleUpdateStatus = (newStatus: string) => {
    if (newStatus === "Completed") {
      toast.error(
        "Status Completed hanya bisa diubah otomatis oleh sistem ketika semua Surat Jalan (DO) sudah terkirim!",
        "Error",
      );
      return;
    }
    if (newStatus === "Cancelled" && (hasDO || hasInvoice)) {
      toast.error(
        "Tidak bisa membatalkan SO ini karena Surat Jalan (DO) atau Invoice sudah diterbitkan!",
        "Error",
      );
      return;
    }
    startStatusTransition(async () => {
      try {
        await updateSalesOrderStatusAction(salesOrder.id, newStatus);
        setSalesOrder({ ...salesOrder, status: newStatus });
        router.refresh();
      } catch (error) {
        toast.error(`Gagal mengupdate status: ${getErrorMessage(error)}`, "Error");
      }
    });
  };
  const handleCreateDO = () => {
    router.push(`/dashboard/delivery-orders/create?so_id=${salesOrder.id}`);
  };
  const handleCreateInvoice = () => {
    const confirm = window.confirm(
      "Buat Invoice Penagihan resmi untuk pesanan ini?",
    );
    if (!confirm) return;
    startInvoiceTransition(async () => {
      try {
        const { invoice_number } = await createInvoiceFromSoAction(
          salesOrder.id,
        );
        toast.success(
          `Luar biasa! Invoice ${invoice_number} berhasil digenerate oleh sistem.`,
          "Success",
        );
        router.push("/dashboard/invoices");
      } catch (error) {
        toast.error(`Gagal membuat Invoice: ${getErrorMessage(error)}`, "Error");
      }
    });
  };
  const isStatusLocked =
    salesOrder.status === "Completed" || hasDO || hasInvoice;
  const isActionable =
    salesOrder.status !== "Cancelled" && salesOrder.status !== "Completed";
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 pb-10 print:m-0 print:p-0 print:max-w-none text-black relative">
      {/* KONTROL UI (GAYA MODERN FIT TO A4) */}
      <div className="print:hidden w-full max-w-[210mm] mx-auto card-modern p-4 sm:p-5 md:p-6 border-l-4 border-l-slate-800 animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
        <div className="doc-header-row">
          {/* Kiri: Tombol Kembali & Status (sejajar di mobile) */}
          <div className="flex flex-row items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/dashboard/sales-orders"
              aria-label="Kembali"
              title="Kembali"
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
            <div className="min-w-0">
              <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Status SO
              </span>
              <select
                value={salesOrder.status || ""}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={isStatusLocked || isUpdatingStatus}
                title="Status Sales Order"
                className={`input-modern font-bold h-10 sm:h-[42px] w-[112px] text-[10px] px-2 sm:text-sm sm:px-3 sm:w-44 ${
                  isStatusLocked ? "opacity-80 cursor-not-allowed" : ""
                }`}
              >
                <option value="Open">Open</option>
                <option value="Processing">Processing</option>
                {salesOrder.status === "Completed" && (
                  <option value="Completed">Completed</option>
                )}
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {/* Kanan: Action Buttons */}
          <div className="flex flex-row items-center sm:flex-wrap md:justify-end gap-2 sm:gap-2.5 shrink-0">
            {(isActionable || hasDO || hasInvoice) && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Tombol Buat DO: tetap tersedia selama SO belum Completed/Cancelled → mendukung DO partial */}
                {isActionable && (
                  <button
                    onClick={handleCreateDO}
                    title="Buat Surat Jalan (DO)"
                    aria-label="Buat Surat Jalan (DO)"
                    className="btn-icon-mobile inline-flex items-center justify-center sm:h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1h-3m3 0h2a1 1 0 001-1v-3.586a1 1 0 00-.293-.707l-2.414-2.414A1 1 0 0016.586 8H13v8z" />
                    </svg>
                    <span className="btn-label">Buat DO</span>
                  </button>
                )}
                {/* Tombol Lihat DO: muncul kalau sudah ada minimal 1 DO */}
                {hasDO && (
                  <Link
                    href="/dashboard/delivery-orders"
                    title="Lihat Surat Jalan (DO)"
                    aria-label="Lihat Surat Jalan (DO)"
                    className="btn-icon-mobile inline-flex items-center justify-center sm:h-[42px] sm:gap-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="btn-label">Lihat DO</span>
                  </Link>
                )}
                {!hasInvoice && salesOrder.status !== "Cancelled" ? (
                  <button
                    onClick={handleCreateInvoice}
                    disabled={isCreatingInvoice}
                    title="Buat Invoice"
                    aria-label="Buat Invoice"
                    className="btn-icon-mobile inline-flex items-center justify-center sm:h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="btn-label">
                      {isCreatingInvoice ? "Memproses…" : "Buat INV"}
                    </span>
                  </button>
                ) : hasInvoice ? (
                  <Link href="/dashboard/invoices"
                    title="Lihat Invoice"
                    aria-label="Lihat Invoice"
                    className="btn-icon-mobile inline-flex items-center justify-center sm:h-[42px] sm:gap-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="btn-label">Lihat INV</span>
                  </Link>
                ) : null}
              </div>
            )}
            {/* Tombol Print */}
            <button
              onClick={handlePrint}
              title="Cetak PDF"
              aria-label="Cetak PDF"
              className="btn-icon-mobile inline-flex items-center justify-center sm:h-[42px] bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
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
      <SalesOrderPrintSheet
        salesOrder={salesOrder}
        customer={customer}
        address={address}
        items={items}
      />
    </div>
  );
}
