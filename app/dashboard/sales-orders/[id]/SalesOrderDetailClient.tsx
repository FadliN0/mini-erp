"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Alert";
import {
  updateSalesOrderStatusAction,
  createInvoiceFromSoAction,
} from "./actions";

export default function SalesOrderDetailClient({
  salesOrder: initialSalesOrder,
  customer,
  address,
  items,
  hasDO,
  hasInvoice,
}: {
  salesOrder: any;
  customer: any;
  address: any;
  items: any[];
  hasDO: boolean;
  hasInvoice: boolean;
}) {
  const router = useRouter();
  const [salesOrder, setSalesOrder] = useState<any>(initialSalesOrder);
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
      } catch (error: any) {
        toast.error(`Gagal mengupdate status: ${error.message}`, "Error");
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
      } catch (error: any) {
        toast.error(`Gagal membuat Invoice: ${error.message}`, "Error");
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
                value={salesOrder.status}
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
      {/* WRAPPER PDF (KERTAS A4) */}
      <div className="w-full overflow-x-auto pb-8 custom-scrollbar print:overflow-visible print:pb-0">
        {/* KERTAS A4 */}
        <div
          className="print-sheet bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none mx-auto relative overflow-hidden"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "44px 48px 72px",
            fontFamily: "'Noto Sans', Arial, sans-serif",
            fontSize: 11,
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
            >
              <Image
                src="/logo1.png"
                alt="CV. HJP Logo"
                width={120}
                height={40}
                style={{
                  width: 120,
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  marginTop: 2,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  CV HARMONISINDO JAYA PART
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    color: "#7D7A75",
                    lineHeight: 1.55,
                    marginTop: 4,
                  }}
                >
                  SOHO Capital Lantai 32 Unit 7, Jl. Letjen S. Parman Kav. 28
                  <br />
                  Kel. Tanjung Duren Selatan, Kec. Grogol Petamburan
                  <br />
                  Jakarta Barat, DKI Jakarta
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  letterSpacing: 3,
                  lineHeight: 1,
                }}
              >
                SALES ORDER
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 2.5,
                  color: "#2783DE",
                  marginTop: 6,
                }}
              >
                ORDER CONFIRMATION
              </div>
            </div>
          </div>
          {/* ACCENT DIVIDER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "20px 0 18px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: 4,
                background: "#054b91",
                borderRadius: 5,
              }}
            />
            <div style={{ flex: 1, height: 1, background: "#E6E5E3" }} />
          </div>
          {/* INFO CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.25fr 0.75fr",
              gap: 14,
              marginBottom: 22,
            }}
          >
            <div style={infoCard}>
              <div style={{ ...docLabel, marginBottom: 6 }}>ORDER BY</div>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
                {customer?.company_name}
              </div>
              <div style={{ ...docLabel, marginBottom: 4 }}>SHIP TO</div>
              <div
                style={{
                  fontSize: 10.5,
                  lineHeight: 1.55,
                  color: "#2C2C2B",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {address?.complete_address}
              </div>
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px solid #E6E5E3",
                  fontSize: 10.5,
                }}
              >
                <span style={docLabel}>ATTN&nbsp;&nbsp;</span>
                <span style={{ fontWeight: 700 }}>
                  {address?.pic_name || "-"}
                </span>
                <span style={{ color: "#7D7A75" }}>
                  {" "}
                  · {address?.pic_phone || "-"}
                </span>
              </div>
            </div>
            <div style={infoCard}>
              <div style={{ ...docLabel, marginBottom: 10 }}>
                ORDER DETAILS
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 10, color: "#7D7A75", flexShrink: 0 }}>
                  SO Number
                </span>
                <span style={{ fontSize: 12, fontWeight: 800 }}>
                  {salesOrder.so_number}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 10, color: "#7D7A75", flexShrink: 0 }}>
                  Date
                </span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>
                  {new Date(salesOrder.created_at).toLocaleDateString(
                    "en-GB",
                    { day: "2-digit", month: "short", year: "numeric" },
                  )}
                </span>
              </div>
              <div
                style={{
                  background: "#FBEBDE",
                  borderRadius: 6,
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    color: "#D5803B",
                    marginBottom: 3,
                  }}
                >
                  CUSTOMER P.O
                </div>
                <div
                  style={{ fontSize: 13, fontWeight: 800, color: "#2C2C2B" }}
                >
                  {salesOrder.po_number || "TIDAK ADA PO"}
                </div>
              </div>
            </div>
          </div>
          {/* TABEL BARANG */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              marginBottom: 6,
            }}
          >
            <colgroup>
              <col style={{ width: 30 }} />
              <col style={{ width: 105 }} />
              <col />
              <col style={{ width: 38 }} />
              <col style={{ width: 44 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 42 }} />
              <col style={{ width: 108 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thCol, textAlign: "center" }}>No</th>
                <th style={thCol}>Part Number</th>
                <th style={thCol}>Description</th>
                <th style={{ ...thCol, textAlign: "center" }} colSpan={2}>
                  Qty
                </th>
                <th style={{ ...thCol, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...thCol, textAlign: "center" }}>Disc</th>
                <th style={{ ...thCol, textAlign: "right" }}>Total (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} style={{ pageBreakInside: "avoid" }}>
                  <td
                    style={{
                      ...tdRow,
                      textAlign: "center",
                      color: "#7D7A75",
                    }}
                  >
                    {index + 1}
                  </td>
                  <td style={{ ...tdRow, fontWeight: 700, fontSize: 10.5 }}>
                    {item.products?.part_code}
                  </td>
                  <td
                    style={{
                      ...tdRow
                    }}
                    className="whitespace-normal break-words"
                  >
                    <div style={{ lineHeight: 1.4, fontWeight: 700 }}>
                      {item.products?.part_name}
                    </div>
                    {item.products?.remark && (
                      <div
                        style={{
                          fontSize: 9.5,
                          color: "#7D7A75",
                          fontStyle: "italic",
                          marginTop: 2,
                        }}
                      >
                        ({item.products.remark})
                      </div>
                    )}
                    {item.item_note && (
                      <div
                        style={{
                          fontSize: 9.5,
                          color: "#7D7A75",
                          fontStyle: "italic",
                          marginTop: 2,
                        }}
                      >
                        ({item.item_note})
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      ...tdRow,
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {item.qty}
                  </td>
                  <td
                    style={{
                      ...tdRow,
                      textAlign: "center",
                      color: "#7D7A75",
                      fontSize: 10,
                    }}
                  >
                    {item.products?.unit}
                  </td>
                  <td
                    style={{
                      ...tdRow,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.unit_price?.toLocaleString("id-ID")}
                  </td>
                  <td style={{ ...tdRow, textAlign: "center" }}>
                    {item.discount > 0 ? (
                      <span
                        style={{
                          background: "#E5F2FC",
                          color: "#2783DE",
                          fontWeight: 700,
                          fontSize: 9.5,
                          padding: "2px 7px",
                          borderRadius: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.discount}%
                      </span>
                    ) : (
                      <span style={{ color: "#B5B3AF" }}>—</span>
                    )}
                  </td>
                  <td
                    style={{
                      ...tdRow,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                    }}
                  >
                    {item.total_price?.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
              <tr style={{ pageBreakInside: "avoid" }}>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "right",
                    padding: "16px 14px 4px 6px",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    color: "#7D7A75",
                    verticalAlign: "middle",
                  }}
                >
                  GRAND TOTAL
                </td>
                <td
                  colSpan={2}
                  style={{ padding: "10px 0 4px", verticalAlign: "middle" }}
                >
                  <div
                    style={{
                      background: "#2C2C2B",
                      color: "#ffffff",
                      borderRadius: 6,
                      padding: "8px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        opacity: 0.7,
                        marginRight: 10,
                      }}
                    >
                      Rp
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 900 }}>
                      {salesOrder.grand_total?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          {/* INTERNAL NOTES */}
          <div style={{ margin: "26px 0 40px", pageBreakInside: "avoid" }}>
            <div
              style={{
                background: "#F9F8F7",
                border: "1px solid #E6E5E3",
                borderLeft: "3px solid #2783DE",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              <div style={{ ...docLabel, marginBottom: 5 }}>
                INTERNAL REMARKS / INSTRUCTIONS
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontStyle: "italic",
                  color: "#55514C",
                  lineHeight: 1.55,
                }}
              >
                {salesOrder.notes ||
                  "Harap diproses sesuai standard operasi perusahaan. Segera terbitkan Surat Jalan (Delivery Order) jika barang sudah siap."}
              </div>
            </div>
          </div>
          {/* TANDA TANGAN */}
          {/* <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              padding: "0 8px",
              pageBreakInside: "avoid",
            }}
          >
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={sigLabel}>Prepared By</div>
              <div style={{ height: 64 }} />
              <div style={sigLine}>
                <div style={{ fontSize: 11, fontWeight: 800 }}>
                  Tim Admin Sales
                </div>
                <div style={{ fontSize: 8.5, color: "#9C9A96", marginTop: 3 }}>
                  Date: ........................
                </div>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={sigLabel}>Authorized By</div>
              <div style={{ height: 64 }} />
              <div style={sigLine}>
                <div style={{ fontSize: 11, fontWeight: 800 }}>
                  ..........................................
                </div>
                <div style={{ fontSize: 8.5, color: "#9C9A96", marginTop: 3 }}>
                  Sales Manager / Director
                </div>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={sigLabel}>Checked By (Warehouse)</div>
              <div style={{ height: 64 }} />
              <div style={sigLine}>
                <div style={{ fontSize: 11, fontWeight: 800 }}>
                  ..........................................
                </div>
                <div style={{ fontSize: 8.5, color: "#9C9A96", marginTop: 3 }}>
                  Kepala Gudang
                </div>
              </div>
            </div>
          </div> */}
          {/* FOOTER */}
          <div
            style={{
              position: "absolute",
              left: 48,
              right: 48,
              bottom: 28,
              borderTop: "1px solid #E6E5E3",
              paddingTop: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 8.5, color: "#9C9A96" }}>
              Terima kasih atas kepercayaan Anda.
            </span>
            <span
              style={{
                fontSize: 8.5,
                color: "#9C9A96",
                textAlign: "right",
              }}
            >
              CV Harmonindo Jaya Part — SOHO Capital Lt. 32 Unit 7, Jakarta
              Barat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
/* Style helpers */
const docLabel: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "#7D7A75",
};
const infoCard: React.CSSProperties = {
  background: "#F9F8F7",
  border: "1px solid #E6E5E3",
  borderRadius: 10,
  padding: "16px 18px",
};
const thCol: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 800,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "#7D7A75",
  padding: "8px 6px",
  borderBottom: "2px solid #2C2C2B",
  textAlign: "left",
};
const tdRow: React.CSSProperties = {
  padding: "10px 6px",
  borderBottom: "1px solid #E6E5E3",
  fontSize: 11,
  verticalAlign: "middle",
};
const sigLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#7D7A75",
};
const sigLine: React.CSSProperties = {
  borderTop: "1.5px solid #2C2C2B",
  margin: "0 12px",
  paddingTop: 6,
};