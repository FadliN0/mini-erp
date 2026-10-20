"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  updateQuotationStatusAction,
  generateSalesOrderAction,
} from "./actions";

/* ─── Konfigurasi Pagination Pintar ─── */
const ROWS_FULL_PAGE = 12; // Kapasitas halaman penuh (tanpa Total, Note & TTD)
const ROWS_LAST_PAGE = 8;  // Kapasitas halaman terakhir (dengan Total, Note & TTD)

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

/* ─── Style helpers ─── */
const tdBase: React.CSSProperties = {
  padding: "2px 0",
  verticalAlign: "top",
  fontSize: 11,
};
const tdLabel: React.CSSProperties = {
  ...tdBase,
  width: 50,
  whiteSpace: "nowrap",
};
const tdColon: React.CSSProperties = { ...tdBase, width: 10, paddingRight: 6 };
const tdValue: React.CSSProperties = { ...tdBase };
const thStyle: React.CSSProperties = {
  border: "1px solid #bbb",
  padding: "6px 6px",
  textAlign: "center",
  background: "#ffffff",
  color: "#000000",
  fontWeight: 700,
  fontSize: 11,
};
const tdItem: React.CSSProperties = {
  border: "1px solid #bbb",
  padding: "5px 6px",
  fontSize: 11,
  verticalAlign: "middle",
};

type QuotationDetailClientProps = {
  id: string;
  initialQuotation: any;
  customer: any;
  address: any;
  items: any[];
  initialExistingSO: any;
};

export default function QuotationDetailClient({
  id,
  initialQuotation,
  customer,
  address,
  items,
  initialExistingSO,
}: QuotationDetailClientProps) {
  const [quotation, setQuotation] = useState<any>(initialQuotation);
  const [existingSO, setExistingSO] = useState<any>(initialExistingSO);

  const subTotal = (items || []).reduce(
    (sum: number, i: any) => sum + (i.total_price || 0),
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

  const getValidityDays = () => {
    if (!quotation?.created_at || !quotation?.valid_until) return 0;
    const start = new Date(quotation.created_at).getTime();
    const end = new Date(quotation.valid_until).getTime();
    const diffDays = Math.ceil((end - start) / (1000 * 3600 * 24));
    return diffDays > 0 ? diffDays : 0;
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
        discount: i.discount,
        total_price: i.total_price,
      }));
      const res = await generateSalesOrderAction({
        quotationId: id,
        poNumber: poInput.trim(),
        customerId: quotation.customer_id,
        addressId: quotation.address_id,
        grandTotal: quotation.grand_total,
        items: itemsPayload,
      });
      if (!res.success) throw new Error(res.error);
      const rpcResult = res.data;
      if (rpcResult && rpcResult.success) {
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
    } catch (error: any) {
      console.error(error);
      alert(`Gagal membuat SO: ${error.message}`);
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

      {/* ── WRAPPER PDF MULTI-HALAMAN (KERTAS A4) ── */}
      <div className="w-full overflow-x-auto pb-8 custom-scrollbar print:overflow-visible print:pb-0 relative">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === totalPages - 1;
          const startNo = pages
            .slice(0, pageIndex)
            .reduce((acc, p) => acc + p.length, 0);
          const targetRows = isLastPage ? ROWS_LAST_PAGE : ROWS_FULL_PAGE;
          const emptyRowsCount = Math.max(0, targetRows - pageItems.length);

          return (
            <div
              key={pageIndex}
              className="print-sheet bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none mx-auto mb-8 print:mb-0 relative overflow-hidden"
              style={{
                width: "210mm",
                minHeight: "285mm",
                padding: "14mm 18mm", // Margin atas & bawah terjamin di setiap halaman!
                boxSizing: "border-box",
                fontFamily: "'Noto Sans', Arial, sans-serif",
                fontSize: 11,
                breakAfter: isLastPage ? "auto" : "page",
                pageBreakAfter: isLastPage ? "auto" : "always",
                pageBreakInside: "avoid",
              }}
            >
              {/* ── HEADER: logo + nama perusahaan + alamat (diulang tiap halaman) ── */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <Image
                    src="/logo1.png"
                    alt="CV. HJP Logo"
                    width={110}
                    height={60}
                    style={{ height: "auto", objectFit: "contain" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    CV HARMONISINDO JAYA PART
                  </div>
                  <div style={{ fontSize: 10, color: "#444", lineHeight: 1.55 }}>
                    SOHO CAPITAL lantai. 32 unit 7 Jl. Letjen S. Parman
                    <br />
                    Kav. 28, Kelurahan Tanjung Duren Selatan
                    <br />
                    Kec. Grogol Petamburan, Jakarta Barat
                  </div>
                </div>
              </div>

              {/* ── BANNER SALES QUOTATION (full width) ── */}
              <div
                className="print-banner-blue print-keep-bg"
                style={{
                  backgroundColor: "#487bc8",
                  boxShadow: "inset 0 0 0 1000px #487bc8",
                  color: "#000000",
                  textAlign: "center",
                  padding: "4px 0",
                  marginBottom: 8,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                } as React.CSSProperties}
              >
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1 }}>
                  Sales Quotation
                </span>
              </div>

              {/* ── INFO (1 tabel agar tiap baris kiri-kanan selalu sejajar) ── */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: 12,
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: 50 }} />
                  <col style={{ width: 10 }} />
                  <col />
                  <col style={{ width: 24 }} />
                  <col style={{ width: 55 }} />
                  <col style={{ width: 10 }} />
                  <col style={{ width: 130 }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>TO</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td
                      style={{
                        ...tdValue,
                        verticalAlign: "top",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {customer?.company_name}
                    </td>
                    <td />
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>No</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td
                      style={{ ...tdValue, verticalAlign: "top", fontWeight: 700 }}
                    >
                      {quotation.quotation_number}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>Address</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td
                      style={{
                        ...tdValue,
                        verticalAlign: "top",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                      }}
                    >
                      {address?.complete_address}
                    </td>
                    <td />
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>MR No</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td
                      style={{ ...tdValue, verticalAlign: "top", fontWeight: 500 }}
                    >
                      {quotation.mr_number || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>Telp</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td style={{ ...tdValue, verticalAlign: "top" }}>
                      {address?.pic_phone ? `${address.pic_phone}` : ""}
                    </td>
                    <td />
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>Date</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td style={{ ...tdValue, verticalAlign: "top" }}>
                      {new Date(quotation.created_at)
                        .toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        .replace(/ /g, "-")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>Email</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td style={{ ...tdValue, verticalAlign: "top" }}>
                      {customer?.email || ""}
                    </td>
                    <td />
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>Validity</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td style={{ ...tdValue, verticalAlign: "top" }}>
                      {getValidityDays()} Days
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>Fax</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td style={{ ...tdValue, verticalAlign: "top" }}>
                      {""}
                    </td>
                    <td />
                    <td style={{ ...tdLabel, verticalAlign: "top" }}>Attn</td>
                    <td style={{ ...tdColon, verticalAlign: "top" }}>:</td>
                    <td style={{ ...tdValue, verticalAlign: "top" }}>
                      {address?.pic_name || ""}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ── TABEL BARANG ── */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: 14,
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: 30 }} />
                  <col style={{ width: 95 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 32 }} />
                  <col style={{ width: 32 }} />
                  <col style={{ width: 93 }} />
                  <col style={{ width: 35 }} />
                  <col />
                  <col style={{ width: 73 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thStyle}>No</th>
                    <th style={thStyle}>Part Number</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle} colSpan={2}>
                      Qty
                    </th>
                    <th style={thStyle}>Unit Price</th>
                    <th style={thStyle}>Disc</th>
                    <th style={thStyle}>Amount (IDR)</th>
                    <th style={thStyle}>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, index) => (
                    <tr key={item.id || `${pageIndex}-${index}`} style={{ pageBreakInside: "avoid" }}>
                      <td style={{ ...tdItem, textAlign: "center" }}>
                        {startNo + index + 1}
                      </td>
                      <td
                        style={{ ...tdItem, fontWeight: 400 }}
                        className="whitespace-normal break-words"
                      >
                        {item.products?.part_code}
                      </td>
                      <td style={tdItem}>
                        <div style={{ lineHeight: 1.35 }}>
                          {item.products?.part_name}
                        </div>
                      </td>
                      <td style={{ ...tdItem, textAlign: "center" }}>{item.qty}</td>
                      <td style={{ ...tdItem, textAlign: "left" }}>
                        {item.products?.unit}
                      </td>
                      <td style={{ ...tdItem, whiteSpace: "nowrap" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Rp.</span>
                          <span>{item.unit_price?.toLocaleString("id-ID")}</span>
                        </div>
                      </td>
                      <td style={{ ...tdItem, textAlign: "center" }}>
                        {item.discount > 0
                          ? `${String(item.discount).replace(".", ",")}%`
                          : ""}
                      </td>
                      <td
                        style={{ ...tdItem, whiteSpace: "nowrap", fontWeight: 400 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Rp.</span>
                          <span>{item.total_price?.toLocaleString("id-ID")}</span>
                        </div>
                      </td>
                      <td
                        style={{ ...tdItem, textAlign: "center" }}
                        className="whitespace-normal break-words"
                      >
                        {item.products?.remark || ""}
                      </td>
                    </tr>
                  ))}

                  {/* Baris kosong pengisi agar tabel terlihat proporsional */}
                  {Array.from({ length: emptyRowsCount }).map((_, i) => (
                    <tr key={`empty-${pageIndex}-${i}`}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j} style={{ ...tdItem, height: 22 }} />
                      ))}
                    </tr>
                  ))}

                  {/* ── SUB TOTAL, DISCOUNT & TOTAL → HANYA DI HALAMAN TERAKHIR ── */}
                  {isLastPage && (
                    <>
                      {discountAmount > 0 && (
                        <>
                          <tr style={{ pageBreakInside: "avoid" }}>
                            <td
                              colSpan={7}
                              style={{
                                ...tdItem,
                                textAlign: "right",
                                fontWeight: 700,
                                border: "none",
                                borderTop: "1px solid #bbb",
                              }}
                            >
                              Sub Total
                            </td>
                            <td
                              style={{
                                ...tdItem,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                borderTop: "1px solid #bbb",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Rp.</span>
                                <span>{subTotal.toLocaleString("id-ID")}</span>
                              </div>
                            </td>
                            <td
                              style={{ border: "none", borderTop: "1px solid #bbb" }}
                            />
                          </tr>
                          <tr style={{ pageBreakInside: "avoid" }}>
                            <td
                              colSpan={7}
                              style={{
                                ...tdItem,
                                textAlign: "right",
                                fontWeight: 700,
                                border: "none",
                              }}
                            >
                              Discount
                            </td>
                            <td
                              style={{
                                ...tdItem,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>Rp.</span>
                                <span>{discountAmount.toLocaleString("id-ID")}</span>
                              </div>
                            </td>
                            <td style={{ border: "none" }} />
                          </tr>
                        </>
                      )}
                      <tr style={{ pageBreakInside: "avoid" }}>
                        <td
                          colSpan={7}
                          style={{
                            ...tdItem,
                            textAlign: "right",
                            fontWeight: 700,
                            border: "none",
                          }}
                        >
                          Total
                        </td>
                        <td
                          style={{ ...tdItem, fontWeight: 700, whiteSpace: "nowrap" }}
                        >
                          <div
                            style={{ display: "flex", justifyContent: "space-between" }}
                          >
                            <span>Rp.</span>
                            <span>
                              {quotation.grand_total?.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </td>
                        <td style={{ border: "none" }} />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* ── CATATAN & TANDA TANGAN → HANYA DI HALAMAN TERAKHIR ── */}
              {isLastPage && (
                <>
                  <div style={{ marginBottom: 20, pageBreakInside: "avoid" }}>
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontWeight: 700,
                        textDecoration: "underline",
                        fontSize: 11,
                      }}
                    >
                      NOTE :
                    </p>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        margin: "0 0 8px",
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      {quotation.notes ? quotation.notes : "Ready Stock\nFranco Site"}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#b00000",
                        fontStyle: "italic",
                        fontSize: 11,
                      }}
                    >
                      All payment to Bank MANDIRI No. 1560024959530 a.n CV HARMONISINDO
                      JAYA PART
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 11 }}>Quote by,</p>
                      <div style={{ height: 55 }} />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "capitalize",
                          textDecoration: "underline",
                        }}
                      >
                        Fatin
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 11 }}>Approved by,</p>
                      <div style={{ height: 55 }} />
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "capitalize",
                          textDecoration: "underline",
                        }}
                      >
                        {address?.pic_name || "................................"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {/* ── AKHIR WRAPPER PDF ── */}

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
