import Image from "next/image";
import type { Tables } from "@/lib/database.types";
import { fmtDateGB } from "@/lib/format";
import type { InvoiceDetailItem } from "./InvoiceDetailClient";
import { ROWS_FULL_PAGE, ROWS_LAST_PAGE } from "./InvoiceDetailClient";

function angkaKeTerbilang(nilai: number): string {
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", 
    "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  const n = Math.floor(Math.abs(nilai));

  if (n < 12) return bilangan[n];
  if (n < 20) return angkaKeTerbilang(n - 10) + " Belas";
  if (n < 100) return angkaKeTerbilang(Math.floor(n / 10)) + " Puluh " + angkaKeTerbilang(n % 10);
  if (n < 200) return "Seratus " + angkaKeTerbilang(n - 100);
  if (n < 1000) return angkaKeTerbilang(Math.floor(n / 100)) + " Ratus " + angkaKeTerbilang(n % 100);
  if (n < 2000) return "Seribu " + angkaKeTerbilang(n - 1000);
  if (n < 1000000) return angkaKeTerbilang(Math.floor(n / 1000)) + " Ribu " + angkaKeTerbilang(n % 1000);
  if (n < 1000000000) return angkaKeTerbilang(Math.floor(n / 1000000)) + " Juta " + angkaKeTerbilang(n % 1000000);
  if (n < 1000000000000) return angkaKeTerbilang(Math.floor(n / 1000000000)) + " Miliar " + angkaKeTerbilang(n % 1000000000);
  return "";
}

function formatTerbilangRupiah(nominal: number): string {
  if (!nominal || nominal <= 0) return "Nol Rupiah";
  return `${angkaKeTerbilang(nominal).replace(/\s+/g, " ").trim()} Rupiah`;
}

/* ─── Style helpers ─── */
const thStyle: React.CSSProperties = {
  border: "1px solid #000",
  borderBottom: "3px double #000",
  borderTop: "1px solid #000",
  padding: "5px 6px",
  textAlign: "center",
  background: "#fff",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
};

const tdItem: React.CSSProperties = {
  border: "1px solid #000",
  padding: "8px 7px",
  fontSize: 11,
  verticalAlign: "middle",
  color: "#000",
};

type InvoicePrintSheetsProps = {
  printMode: "invoice" | "non_pkp" | "both";
  invoice: Tables<"invoices">;
  salesOrder: Tables<"sales_orders"> | null;
  customer: Tables<"customers"> | null;
  billingAddress: Tables<"customer_addresses"> | null;
  pages: InvoiceDetailItem[][];
  totalPages: number;
  subTotal: number;
  grandTotal: number;
  discountInput: number;
  invoiceNote: string;
  itemNotes: Record<string, string>;
  todayFormatted: string;
  isCancelled: boolean;
  isPaid: boolean;
  isEditable: boolean;
  francoTerm: string;
  onEditAddress: () => void;
  onInvoiceNoteChange: (value: string) => void;
  onItemNotesChange: (notes: Record<string, string>) => void;
};

// Seluruh lembar cetak invoice (surat non-PKP + invoice resmi per halaman).
// Dipisah dari InvoiceDetailClient agar file induk fokus ke logika & panel kontrol.
export default function InvoicePrintSheets({
  printMode,
  invoice,
  salesOrder,
  customer,
  billingAddress,
  pages,
  totalPages,
  subTotal,
  grandTotal,
  discountInput,
  invoiceNote,
  itemNotes,
  todayFormatted,
  isCancelled,
  isPaid,
  isEditable,
  francoTerm,
  onEditAddress,
  onInvoiceNoteChange,
  onItemNotesChange,
}: InvoicePrintSheetsProps) {
  const borderCell = "1px solid #000";
  const font = "Arial, Helvetica, sans-serif";
  const baseSize = 11;

  return (
    <>
          {/* 1. BLOK SURAT NON-PKP */}
          {(printMode === "non_pkp" || printMode === "both") && (
            <div
              // Gunakan .print-sheet dari globals.css, lalu timpa padding print-nya dengan !px-[35mm]
              className="print-sheet bg-white shadow-xl border border-slate-200 mx-auto mb-8 relative overflow-hidden min-h-[297mm] w-[210mm] !py-[20mm] !px-[25mm] print:min-h-0 print:mb-0 print:shadow-none print:border-none"
              style={{
                boxSizing: "border-box",
                fontFamily: "Cambria, Cochin, Georgia, Times, 'Times New Roman', serif",
                fontSize: "11pt",
                lineHeight: "1.6",
                color: "#000",
                position: "relative",
                overflow: "hidden",
                pageBreakAfter: printMode === "both" ? "always" : "auto",
              }}
            >
              {/* ── LAYER 1: WATERMARK LOGO DI TENGAH KERTAS ── */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 0, // Di belakang teks
                }}
              >
                {/* Pastikan src="/logo.png" sesuai dengan path logo di Kop Invoice Anda */}
                <img
                  src="/logo1.png"
                  alt="Watermark HJP"
                  style={{
                    width: "550px",
                    height: "auto",
                    opacity: 0.2, // Tingkat transparansi watermark (0.08 = 8%)

                  }}
                />
              </div>

              {/* ── LAYER 2: KONTEN SURAT (DI ATAS WATERMARK) ── */}
              <div style={{ position: "relative", zIndex: 10 }}>
                
                {/* KOP SURAT */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "2.5px solid #000",
                    paddingBottom: "10px",
                    marginBottom: "28px",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: "15pt", fontWeight: 900, letterSpacing: "0.5px" }}>
                      CV HARMONISINDO JAYA PART
                    </h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "9.5pt", lineHeight: "1.35" }}>
                      SOHO CAPITAL lantai. 32 unit 7 Jl. Letjen S. Parman<br />
                      Kav. 28, Kelurahan Tanjung Duren Selatan<br />
                      Kec. Grogol Petamburan, Jakarta Barat<br />
                      <strong>Telp: 0877-4266-1813</strong>
                    </p>
                  </div>
                  <img
                    src="/logo1.png"
                    alt="Logo HJP"
                    style={{ width: "150px", height: "auto", objectFit: "contain" }}
                  />
                </div>
                {/* JUDUL SURAT */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: "13.5pt",
                      fontWeight: 700,
                      textDecoration: "underline",
                      textTransform: "uppercase",
                    }}
                  >
                    SURAT PERNYATAAN NON PKP
                  </h1>
                </div>

                {/* PEMBUKA & TABEL BIODATA */}
                <p style={{ margin: "0 0 12px 0" }}>
                  Yang Bertanda Tangan Dibawah Ini Sebagai Berikut:
                </p>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "11pt" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "160px", padding: "3px 0", verticalAlign: "top" }}>Nama</td>
                      <td style={{ width: "15px", padding: "3px 0", verticalAlign: "top" }}>:</td>
                      <td style={{ padding: "3px 0", fontWeight: 700 }}>Hana Khamila</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>No. NIK</td>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                      <td style={{ padding: "3px 0" }}>3216026305960004</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>Jabatan</td>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                      <td style={{ padding: "3px 0" }}>Owner (Direktur)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>Nama Perusahaan</td>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                      <td style={{ padding: "3px 0", fontWeight: 700 }}>Harmonisindo Jaya Part</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>Alamat</td>
                      <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                      <td style={{ padding: "3px 0", lineHeight: "1.4" }}>
                        SOHO CAPITAL lantai. 32 unit 7 Jl. Letjen S. Parman Kav. 28,<br />
                        Kel. Tanjung Duren Selatan, Kec. Grogol Petamburan, Jakarta Barat
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* PARAGRAF PERNYATAAN UTAMA */}
                <p style={{ margin: "0 0 16px 0", textAlign: "justify", lineHeight: "1.75" }}>
                  Dengan ini menyatakan bahwa kami adalah bukan Pengusaha Kena Pajak sebagaimana dimaksud pada undang-undang pajak pertambahan nilai. Oleh karenanya terhadap penjualan/penyerahan barang kena pajak yang kami lakukan ke{" "}
                  <strong>{customer?.company_name || "-"}</strong> dengan NO.PO/SP :{" "}
                  <strong>{salesOrder?.po_number || "-"}</strong> dengan jumlah nominal{" "}
                  <strong>
                    Rp.{Number(grandTotal || 0).toLocaleString("id-ID")}-, ({formatTerbilangRupiah(Number(grandTotal || 0))})
                  </strong>{" "}
                  kami tidak dapat menerbitkan faktur pajak. 
                </p>
                <p>Demikian surat pernyataan ini saya buat dengan sebenarnya dan agar dapat dipergunakan sebagaimana mestinya.</p>

                {/* BLOK TANDA TANGAN KANAN BAWAH */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "48px", pageBreakInside: "avoid" }}>
                  <div style={{ textAlign: "center", minWidth: "220px" }}>
                    <p style={{ margin: 0 }}>
                      Jakarta,{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p style={{ margin: "4px 0 0 0" }}>Pemberi Pernyataan</p>

                    {/* Ruang kosong 110px untuk tempel Meterai 10.000 & TTD */}
                    <div style={{ height: "110px" }} />

                    <p style={{ margin: 0, fontWeight: 700, textDecoration: "underline" }}>
                      Hana Khamila
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        {/* 2. BLOK INVOICE — Pastikan kurung buka '(' langsung bertemu dengan 'pages.map' */}
          {(printMode === "invoice" || printMode === "both") &&
            pages.map((pageItems, pageIndex) => {
            const isLastPage = pageIndex === totalPages - 1;
            // Hitung nomor urut berdasarkan jumlah item di halaman-halaman sebelumnya
            const startNo = pages
              .slice(0, pageIndex)
              .reduce((acc, p) => acc + p.length, 0);
            
            // Baris kosong menyesuaikan apakah ini halaman terakhir atau halaman penuh
            const targetRows = isLastPage ? ROWS_LAST_PAGE : ROWS_FULL_PAGE;
            const emptyRowsCount = Math.max(0, targetRows - pageItems.length);

            return (
              <div
                key={pageIndex}
                className="invoice-sheet bg-white print:shadow-none print:border-none print:rounded-none relative overflow-hidden shadow-xl border border-slate-200 mx-auto mb-8 print:mb-0"
                style={{
                  width: "210mm",
                  minHeight: "285mm", // Dikurangi dari 296mm agar tidak memicu halaman kosong saat print
                  padding: "14mm 18mm", // Margin atas-bawah lebih efisien (1.4 cm)
                  boxSizing: "border-box",
                  fontFamily: font,
                  fontSize: baseSize,
                  color: "#000",
                  breakAfter: isLastPage ? "auto" : "page",
                  pageBreakAfter: isLastPage ? "auto" : "always",
                  pageBreakInside: "avoid",
                }}
              >
                {isPaid && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[12px] border-emerald-500 text-emerald-500 px-10 py-2 rounded-3xl text-9xl font-black uppercase tracking-widest opacity-20 transform -rotate-[25deg] pointer-events-none z-50 print:opacity-[0.15]">
                    PAID
                  </div>
                )}
                {isCancelled && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[12px] border-rose-500 text-rose-500 px-10 py-2 rounded-3xl text-7xl md:text-9xl font-black uppercase tracking-widest opacity-20 transform -rotate-[25deg] pointer-events-none z-50 print:opacity-[0.25]">
                    CANCELED
                  </div>
                )}

                {/* Banner batal hanya di halaman pertama */}
                {isCancelled && pageIndex === 0 && (
                  <div className="mb-6 p-4 border-2 border-rose-500 bg-rose-50 text-rose-900 rounded-lg" style={ { fontSize: 12 } }>
                    <strong className="block mb-1 text-sm uppercase tracking-wider text-rose-700">
                      ⚠ INVOICE INI TELAH DIBATALKAN / HANGUS
                    </strong>
                    <table className="mt-2 text-xs">
                      <tbody>
                        <tr>
                          <td className="w-24 font-bold">Waktu Batal</td>
                          <td>: {invoice?.canceled_at ? new Date(invoice.canceled_at).toLocaleString("id-ID") : "-"}</td>
                        </tr>
                        <tr>
                          <td className="font-bold align-top">Alasan</td>
                          <td>: {invoice?.cancel_reason || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ===== HEADER (diulang tiap halaman) ===== */}
                <div style={ { display: "flex", justifyContent: "space-between", alignItems: "flex-start" } }>
                  <div>
                    <div style={ { fontSize: 16, fontWeight: 900, marginBottom: 4, letterSpacing: 0.3 } }>
                      CV HARMONISINDO JAYA PART
                    </div>
                    <div style={ { fontSize: 10, lineHeight: 1.6 } }>
                      SOHO CAPITAL lantai. 32 unit 7 Jl. Letjen S. Parman
                      <br />
                      Kav. 28, Kelurahan Tanjung Duren Selatan
                      <br />
                      Kec. Grogol Petamburan, Jakarta Barat
                    </div>
                  </div>
                  <div style={ { width: 120, height: 90, flexShrink: 0 } }>
                    <Image
                      src="/logo1.png"
                      alt="Logo"
                      width={100}
                      height={65}
                      style={ { width: "100%", height: "100%", objectFit: "contain" } }
                    />
                  </div>
                </div>

                <hr style={ { border: "none", borderTop: "2px solid #000", margin: "1px 0 1px 0" } } />

                <div style={ { textAlign: "center", marginTop: 2 } }>
                  <div style={ { fontSize: 18, fontWeight: 900, letterSpacing: 2, textDecoration: "underline" } }>
                    INVOICE
                  </div>
                  <div style={ { fontSize: 10 } }>Invoice No. {invoice?.invoice_number}</div>
                </div>

                {/* ===== TO & META (FLEX, PAGE SEJAJAR EMAIL, diulang tiap halaman) ===== */}
                <div style={ { display: "flex", alignItems: "stretch", border: borderCell, marginTop: 3, marginBottom: 16, fontSize: baseSize } }>
                  {/* KIRI: TO */}
                  <div style={ { flex: 1, borderRight: borderCell, padding: "8px", display: "flex", flexDirection: "column" } }>
                    <table style={ { borderCollapse: "collapse", width: "100%" } }>
                      <tbody>
                        <tr>
                          <td style={{ width: 45, fontWeight: 700, verticalAlign: "top" }}>TO</td>
                          <td style={{ width: 15, fontWeight: 700, verticalAlign: "top" }}>:</td>
                          <td style={{ fontWeight: 900, textTransform: "uppercase", verticalAlign: "top" }}>
                            {/* Bungkus nama perusahaan dan tombol dalam flexbox agar sejajar kiri-kanan */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                              <span>{customer?.company_name}</span>
                              <button
                                type="button"
                                onClick={onEditAddress}
                                className="print:hidden text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-300 whitespace-nowrap"
                              >
                                ✎ Ubah Alamat
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td></td>
                          <td></td>
                          <td style={ { paddingBottom: 3, lineHeight: 1.4, whiteSpace: "pre-wrap" } }>
                            {billingAddress?.complete_address || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td style={ { fontWeight: 700 } }>Attn</td>
                          <td style={ { fontWeight: 700 } }>:</td>
                          <td style={ { paddingBottom: 3 } }>{billingAddress?.pic_name || "-"}</td>
                        </tr>
                        <tr>
                          <td style={ { fontWeight: 700 } }>Telp</td>
                          <td style={ { fontWeight: 700 } }>:</td>
                          <td style={ { paddingBottom: 3 } }>
                            {billingAddress?.pic_phone ? ` ${billingAddress.pic_phone}` : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table style={ { borderCollapse: "collapse", width: "100%", marginTop: "auto" } }>
                      <tbody>
                        <tr>
                          <td style={ { width: 45, fontWeight: 700 } }>Email</td>
                          <td style={ { width: 15, fontWeight: 700 } }>:</td>
                          <td>{customer?.email || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* KANAN: META */}
                  <div style={ { flex: 1, padding: "8px", display: "flex", flexDirection: "column" } }>
                    <table style={ { borderCollapse: "collapse", width: "100%" } }>
                      <tbody>
                        <tr>
                          <td style={ { width: 100, paddingBottom: 3 } }>No PO</td>
                          <td style={ { width: 15, paddingBottom: 3 } }>:</td>
                          <td style={ { paddingBottom: 3 } }>{salesOrder?.po_number || "-"}</td>
                        </tr>
                        <tr>
                          <td style={ { paddingBottom: 3 } }>Date</td>
                          <td style={ { paddingBottom: 3 } }>:</td>
                          <td style={ { paddingBottom: 3 } }>
                            {invoice?.created_at
                                ? fmtDateGB(invoice.created_at)
                                : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td style={ { paddingBottom: 3 } }>Payment Terms</td>
                          <td style={ { paddingBottom: 3 } }>:</td>
                          <td style={ { paddingBottom: 3 } }>Cash</td>
                        </tr>
                        <tr>
                          <td>Delivery Terms</td>
                          <td>:</td>
                          <td>{francoTerm}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table style={ { borderCollapse: "collapse", width: "100%", marginTop: "auto" } }>
                      <tbody>
                        <tr>
                          <td style={ { width: 100 } }>Page</td>
                          <td style={ { width: 15 } }>:</td>
                          <td>{pageIndex + 1} of {totalPages}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ===== TABEL ITEM ===== */}
                <table style={ { width: "100%", borderCollapse: "collapse", marginBottom: 0, tableLayout: "fixed", fontSize: baseSize } }>
                  <colgroup>
                    <col style={ { width: 30 } } />
                    <col style={ { width: 100 } } />
                    <col />
                    <col style={ { width: 38 } } />
                    <col style={ { width: 100 } } />
                    <col style={ { width: 110 } } />
                    <col style={ { width: 60 } } />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={thStyle}>NO</th>
                      <th style={thStyle}>PART NUMBER</th>
                      <th style={thStyle}>DESCRIPTION</th>
                      <th style={thStyle}>QTY</th>
                      <th style={thStyle}>PRICE</th>
                      <th style={thStyle}>AMOUNT</th>
                      <th style={thStyle}>NOTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, index) => {
                      const product = item.products;
                      const qty = item.qty_billed ?? item.qty ?? 1;
                      const price = item.unit_price ?? 0;
                      const amount = item.total_price ?? qty * price;
                      const noteTargetId = item.invoice_item_id || item.id;
                      return (
                        <tr key={item.id || `${pageIndex}-${index}`}>
                          <td style={ { ...tdItem, textAlign: "center" } }>
                            {startNo + index + 1}
                          </td>
                          <td style={ { ...tdItem, verticalAlign: "center"}}className="whitespace-normal break-words">{product?.part_code || "-"}</td>
                          <td style={ { ...tdItem, whiteSpace: "normal", wordBreak: "break-word",  } }>
                            {product?.part_name || "-"}
                          </td>
                          <td style={ { ...tdItem, textAlign: "center",  } }>{qty}</td>
                          <td style={ { ...tdItem,  } }>
                            <div style={ { display: "flex", justifyContent: "space-between" } }>
                              <span>Rp</span>
                              <span>{price.toLocaleString("id-ID")}</span>
                            </div>
                          </td>
                          <td style={ { ...tdItem,  } }>
                            <div style={ { display: "flex", justifyContent: "space-between" } }>
                              <span>Rp</span>
                              <span>{amount.toLocaleString("id-ID")}</span>
                            </div>
                          </td>
                          <td style={ { ...tdItem, padding: 0, verticalAlign: "center" } }>
                            <textarea
                              rows={1}
                              value={itemNotes[noteTargetId] !== undefined ? itemNotes[noteTargetId] : ""}
                              onChange={(e) => {
                                onItemNotesChange({ ...itemNotes, [noteTargetId]: e.target.value });
                                e.target.style.height = "auto";
                                e.target.style.height = e.target.scrollHeight + "px";
                              }}
                              disabled={!isEditable}
                              placeholder=""
                              className="w-full bg-transparent border-none outline-none px-2 py-1.5 text-[10px] text-center focus:bg-purple-50 print:p-0 print:focus:bg-transparent disabled:text-black font-medium resize-none overflow-hidden"
                              style={ { minHeight: "26px" } }
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {Array.from({ length: emptyRowsCount }).map((_, i) => (
                      <tr key={`empty-${pageIndex}-${i}`}>
                        <td style={ { ...tdItem, height: 26 } }></td>
                        <td style={tdItem}></td>
                        <td style={tdItem}></td>
                        <td style={tdItem}></td>
                        <td style={tdItem}></td>
                        <td style={tdItem}></td>
                        <td style={tdItem}></td>
                      </tr>
                    ))}

                    {/* FOOTER TOTAL → HANYA di halaman terakhir */}
                    {isLastPage && (
                      <>
                        <tr>
                          <td
                            colSpan={4}
                            rowSpan={3}
                            style={ { border: borderCell, borderTop: "3px double #000", padding: "1px 14px", verticalAlign: "middle"} }
                          >
                            <p style={ { margin: "0 0 6px", fontWeight: 900, fontSize: "13px", textDecoration: "underline" } }>
                              PAYMENT INSTRUCTION / NOTES :
                            </p>
                            <textarea
                              value={invoiceNote}
                              onChange={(e) => onInvoiceNoteChange(e.target.value)}
                              disabled={!isEditable}
                              className="w-full h-16 bg-transparent border-none outline-none resize-none text-[13px] leading-relaxed disabled:text-black font-medium"
                              placeholder="Tulis instruksi transfer di sini..."
                            />
                          </td>
                          <td style={ { border: borderCell, borderTop: "3px double #000", padding: "3px 10px", fontWeight: 700 } }>
                            Sub Total
                          </td>
                          <td colSpan={2} style={ { border: borderCell, borderTop: "3px double #000", padding: "3px 8px" } }>
                            <div style={ { display: "flex", justifyContent: "space-between" } }>
                              <span>Rp</span>
                              <span style={ { textDecoration: isCancelled ? "line-through" : "none" } }>
                                {subTotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={ { border: borderCell, padding: "3px 10px", fontWeight: 700 } }>Discount</td>
                          <td colSpan={2} style={ { border: borderCell, padding: "3px 8px" } }>
                            <div style={ { display: "flex", justifyContent: "space-between", color: discountInput > 0 ? "#e11d48" : "#000" } }>
                              <span>Rp</span>
                              <span>{discountInput > 0 ? discountInput.toLocaleString("id-ID") : "-"}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={ { border: borderCell, padding: "3px 10px", fontWeight: 700 } }>Total</td>
                          <td colSpan={2} style={ { border: borderCell, padding: "3px 8px", fontWeight: 900 } }>
                            <div style={ { display: "flex", justifyContent: "space-between" } }>
                              <span>Rp</span>
                              <span style={ { textDecoration: isCancelled ? "line-through" : "none" } }>
                                {grandTotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                {/* TANGGAL & TANDA TANGAN → HANYA di halaman terakhir */}
                {isLastPage && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, pageBreakInside: "avoid" }}>
                    <div style={{ textAlign: "center", minWidth: 200 }}>
                      <p style={{ margin: 0, fontSize: baseSize }}>Jakarta, {todayFormatted}</p>
                      <p style={{ margin: 0, fontSize: baseSize }}>Harmonisindo JayaPart</p>
                      <div style={{ height: 110}} />
                      <p style={{ margin: 0, fontSize: baseSize, fontWeight: 700, textDecoration: "underline" }}>
                        Hana Khamila
                      </p>
                      <p style={{ margin: 0, fontSize: baseSize }}>Direktur</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })} 
    </>
  );
}
