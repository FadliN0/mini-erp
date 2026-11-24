'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Tables } from "@/lib/database.types";
import DeliveryOrderPrintSheet from "./DeliveryOrderPrintSheet";

/* ─── Konfigurasi Pagination Pintar ─── */
const ROWS_FULL_PAGE = 15; // Kapasitas halaman penuh (tanpa Total & TTD)
const ROWS_LAST_PAGE = 9; // Kapasitas halaman terakhir (berbagi ruang dengan Total & TTD)

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
    // Jika sisa item nanggung, tinggalkan minimal 2 item untuk halaman terakhir
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

export type DeliveryOrderItemRow = {
  id: string;
  qty_delivered: number;
  so_item_id: string;
  sales_order_items: {
    products: Pick<Tables<"products">, "part_code" | "part_name" | "unit" | "remark"> | null;
  } | null;
};

export default function DeliveryOrderDetailClient({
  deliveryOrder,
  salesOrder,
  customer,
  billingAddress,
  shippingAddress,
  items,
  isPartialDelivery,
  invoiceNumber,
}: {
  deliveryOrder: Tables<"delivery_orders">;
  salesOrder: Tables<"sales_orders"> | null;
  customer: Tables<"customers"> | null;
  billingAddress: Tables<"customer_addresses"> | null;
  shippingAddress: Tables<"customer_addresses"> | null;
  items: DeliveryOrderItemRow[];
  isPartialDelivery: boolean;
  invoiceNumber: string | null;
}) {
  const handlePrint = () => window.print();
  const totalQty = items.reduce(
    (sum, item) => sum + (item.qty_delivered || 0),
    0,
  );

  // Pisahkan item ke dalam beberapa halaman
  const pages = paginateItems(items || []);
  const totalPages = pages.length;

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 pb-10 print:m-0 print:p-0 print:max-w-none text-black relative">
      {/* ── KONTROL UI (GAYA MODERN FIT TO A4) ── */}
      <div className="print:hidden w-full max-w-[210mm] mx-auto card-modern p-5 md:p-6 border-l-4 border-l-teal-500 animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
        <div className="doc-header-row">
          <div className="flex flex-row items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/dashboard/delivery-orders"
              title="Kembali ke daftar surat jalan"
              aria-label="Kembali ke daftar surat jalan"
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
                Status Pengiriman
              </span>
              {isPartialDelivery ? (
                <span
                  title="Dikirim sebagian (partial)"
                  className="bg-blue-100 text-blue-700 border border-blue-200 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider inline-block whitespace-nowrap"
                >
                  PARTIAL<span className="hidden sm:inline"> (DIKIRIM SEBAGIAN)</span>
                </span>
              ) : (
                <span
                  title="Selesai (completed)"
                  className="bg-teal-100 text-teal-700 border border-teal-200 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider inline-block whitespace-nowrap"
                >
                  SELESAI<span className="hidden sm:inline"> (COMPLETED)</span>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handlePrint}
            title="Cetak Surat Jalan"
            aria-label="Cetak Surat Jalan"
            className="btn-icon-mobile inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white sm:px-6 sm:py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span className="btn-label">Cetak Surat Jalan</span>
          </button>
        </div>
      </div>

      <DeliveryOrderPrintSheet
        deliveryOrder={deliveryOrder}
        salesOrder={salesOrder}
        customer={customer}
        billingAddress={billingAddress}
        shippingAddress={shippingAddress}
        pages={pages}
        totalPages={totalPages}
        totalQty={totalQty}
        isPartialDelivery={isPartialDelivery}
        invoiceNumber={invoiceNumber}
      />
    </div>
  );
}
