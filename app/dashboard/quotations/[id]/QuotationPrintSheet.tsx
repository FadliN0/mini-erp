import Image from "next/image";
import type { Tables } from "@/lib/database.types";
import type { QuotationItemWithProduct } from "./QuotationDetailClient";
import { ROWS_FULL_PAGE, ROWS_LAST_PAGE } from "./QuotationDetailClient";

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

type QuotationPrintSheetProps = {
  quotation: Tables<"quotations">;
  customer: Tables<"customers"> | null;
  address: Tables<"customer_addresses"> | null;
  pages: QuotationItemWithProduct[][];
  totalPages: number;
  subTotal: number;
  discountAmount: number;
};

// Lembar cetak surat penawaran (multi-halaman A4). Dipisah dari
// QuotationDetailClient agar file induk fokus ke logika & panel kontrol.
export default function QuotationPrintSheet({
  quotation,
  customer,
  address,
  pages,
  totalPages,
  subTotal,
  discountAmount,
}: QuotationPrintSheetProps) {
  const getValidityDays = () => {
    if (!quotation?.created_at || !quotation?.valid_until) return 0;
    const start = new Date(quotation.created_at).getTime();
    const end = new Date(quotation.valid_until).getTime();
    const diffDays = Math.ceil((end - start) / (1000 * 3600 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <>
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
                      {new Date(quotation.created_at || new Date())
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
                        {item.discount
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
    </>
  );
}
