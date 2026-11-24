import Image from "next/image";
import type { Tables } from "@/lib/database.types";
import type { DeliveryOrderItemRow } from "./DeliveryOrderDetailClient";

/* ─── Style helpers ─── */
const thStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "8px 6px",
  textAlign: "center",
  background: "#f8f9fa",
  fontSize: 11,
  fontWeight: "bold",
};
const tdItem: React.CSSProperties = {
  border: "1px solid #000",
  padding: "6px 8px",
  fontSize: 11,
  verticalAlign: "middle",
  color: "#000",
};

type DeliveryOrderPrintSheetProps = {
  deliveryOrder: Tables<"delivery_orders">;
  salesOrder: Tables<"sales_orders"> | null;
  customer: Tables<"customers"> | null;
  billingAddress: Tables<"customer_addresses"> | null;
  shippingAddress: Tables<"customer_addresses"> | null;
  pages: DeliveryOrderItemRow[][];
  totalPages: number;
  totalQty: number;
  isPartialDelivery: boolean;
  invoiceNumber: string | null;
};

// Lembar cetak Surat Jalan (multi-halaman A4). Dipisah dari
// DeliveryOrderDetailClient agar file induk fokus ke panel kontrol.
export default function DeliveryOrderPrintSheet({
  deliveryOrder,
  salesOrder,
  customer,
  billingAddress,
  shippingAddress,
  pages,
  totalPages,
  totalQty,
  isPartialDelivery,
  invoiceNumber,
}: DeliveryOrderPrintSheetProps) {
  return (
    <>
      {/* ── WRAPPER PDF (KERTAS A4 MULTI-PAGE) ── */}
      <div className="w-full overflow-x-auto pb-8 custom-scrollbar print:overflow-visible print:pb-0 relative">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === totalPages - 1;
          const startNo = pages
            .slice(0, pageIndex)
            .reduce((acc, p) => acc + p.length, 0);
          const MIN_ROWS = 5;
          const emptyRowsCount = Math.max(0, MIN_ROWS - pageItems.length);

          return (
            <div
              key={pageIndex}
              className="print-sheet bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none mx-auto mb-8 print:mb-0 relative overflow-hidden"
              style={{
                width: "210mm",
                minHeight: "285mm",
                padding: "14mm 18mm", // Padding dirampingkan agar lebih proporsional
                boxSizing: "border-box",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 12,
                color: "#000",
                breakAfter: isLastPage ? "auto" : "page",
                pageBreakAfter: isLastPage ? "auto" : "always",
                pageBreakInside: "avoid",
              }}
            >
              {/* ===== HEADER ===== */}
              {/* 1. Logo dipisah dan diletakkan di atas */}
              <div style={{ width: 120, height: 80, flexShrink: 0, marginBottom: 8 }}>
                <Image
                  src="/logo1.png"
                  alt="Logo"
                  width={100}
                  height={65}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              {/* 2. Kontainer Flex baru khusus untuk menyejajarkan Teks Kiri dan Teks Kanan */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                {/* Teks Kiri */}
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#000",
                      marginBottom: 1,
                      letterSpacing: 0.5,
                    }}
                  >
                    CV HARMONISINDO JAYA PART
                  </div>
                  <div style={{ fontSize: 11, color: "#000", lineHeight: 1.5 }}>
                    SOHO CAPITAL lantai. 32 unit 7 Jl. Letjen S. Parman
                    <br />
                    Kav. 28, Kelurahan Tanjung Duren Selatan
                    <br />
                    Kec. Grogol Petamburan, Jakarta Barat
                  </div>
                </div>

                {/* Teks Kanan */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: 1,
                      marginBottom: 1,
                    }}
                  >
                    DELIVERY ORDER
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>
                    {deliveryOrder.do_number}
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 2 }}>
                    {new Date(deliveryOrder.delivery_date).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "long", year: "numeric" },
                    )}
                  </div>
                  <div
                    style={{ fontSize: 10, color: "#444", fontWeight: "bold" }}
                  >
                    REF PO: {salesOrder?.po_number?.toUpperCase() || "-"}
                  </div>
                  {invoiceNumber && (
                    <div
                      style={{ fontSize: 10, color: "#444", fontWeight: "bold" }}
                    >
                      REF INV: {invoiceNumber.toUpperCase()}
                    </div>
                  ) }
                </div>
              </div>

              {/* ===== ALAMAT TO & KIRIM KE ===== */}
              <div
                style={{
                  marginBottom: 16,
                  marginTop: 12,
                  fontSize: 11,
                  width: "55%",
                }}
              >
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    tableLayout: "fixed",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ width: 45, verticalAlign: "top" }}>To</td>
                      <td style={{ width: 15, verticalAlign: "top" }}>:</td>
                      <td
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                        }}
                      >
                        {customer?.company_name}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td
                        style={{
                          paddingBottom: 3,
                          lineHeight: 1.4,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {billingAddress?.complete_address ||
                          shippingAddress?.complete_address ||
                          "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>Attn</td>
                      <td style={{ verticalAlign: "top" }}>:</td>
                      <td style={{ paddingBottom: 16 }}>
                        {billingAddress?.pic_name ||
                          shippingAddress?.pic_name ||
                          "-"}
                        {billingAddress?.pic_phone
                          ? ` ${billingAddress.pic_phone}`
                          : shippingAddress?.pic_phone
                            ? ` ${shippingAddress.pic_phone}`
                            : ""}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700, paddingBottom: 4 }}>
                        Deliver To :
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                        }}
                      >
                        {customer?.company_name}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td
                        style={{
                          lineHeight: 1.4,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {shippingAddress?.complete_address || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>Attn</td>
                      <td style={{ verticalAlign: "top" }}>:</td>
                      <td style={{ paddingBottom: 3 }}>
                        {shippingAddress?.pic_name || "-"}
                        {shippingAddress?.pic_phone
                          ? ` ${shippingAddress.pic_phone}`
                          : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ===== TABEL BARANG ===== */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: 16,
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: 45 }} />
                  <col style={{ width: 130 }} />
                  <col />
                  <col style={{ width: 60 }} />
                  <col style={{ width: 60 }} />
                  <col style={{ width: 100 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thStyle}>No.</th>
                    <th style={thStyle}>Part No</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Uom</th>
                    <th style={thStyle}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, index) => {
                    const product = item.sales_order_items?.products;
                    return (
                      <tr key={item.id} style={{ pageBreakInside: "avoid" }}>
                        <td style={{ ...tdItem, textAlign: "center" }}>
                          {startNo + index + 1}
                        </td>
                        <td
                          style={{ ...tdItem, fontWeight: 700 }}
                          className="whitespace-normal break-words"
                        >
                          {product?.part_code || "-"}
                        </td>
                        <td
                          style={{ ...tdItem }}
                          className="whitespace-normal break-words"
                        >
                          {product?.part_name || "-"}
                        </td>
                        <td
                          style={{
                            ...tdItem,
                            textAlign: "center",
                            fontWeight: 800,
                          }}
                        >
                          {item.qty_delivered}
                        </td>
                        <td style={{ ...tdItem, textAlign: "center" }}>
                          {product?.unit || "PCS"}
                        </td>
                        <td
                          style={{
                            ...tdItem,
                            textAlign: "center",
                            fontSize: 10,
                          }}
                        >
                          {product?.remark || "-"}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Qty -> Hanya di halaman terakhir */}
                  {isLastPage && (
                    <tr style={{ pageBreakInside: "avoid" }}>
                      <td
                        colSpan={3}
                        style={{
                          ...tdItem,
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        Total :
                      </td>
                      <td
                        style={{
                          ...tdItem,
                          textAlign: "center",
                          fontWeight: 900,
                        }}
                      >
                        {totalQty}
                      </td>
                      <td style={tdItem}></td>
                      <td style={tdItem}></td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ===== TANDA TANGAN -> Hanya di halaman terakhir ===== */}
              {isLastPage && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: 16,
                    pageBreakInside: "avoid",
                    marginTop: 16,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "#555" }}>
                      Receipt By,
                    </p>
                    <div style={{ height: 75 }} />
                    <p style={{ margin: 0, fontSize: 11, fontWeight: "bold" }}>
                      Nama jelas &
                    </p>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: "bold" }}>
                      Stample
                    </p>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "#555" }}>
                      Dikirim oleh,
                    </p>
                    <div style={{ height: 75 }} />
                    <p style={{ margin: 0, fontSize: 11 }}>
                      ........................
                    </p>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "#555" }}>
                      Dibuat oleh,
                    </p>
                    <div style={{ height: 75 }} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: "bold",
                        textDecoration: "underline",
                      }}
                    >
                      Fatin
                    </p>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 10, color: "#555" }}>
                      Diketahui oleh,
                    </p>
                    <div style={{ height: 75 }} />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: "bold",
                        textDecoration: "underline",
                      }}
                    >
                      Hana Khamila
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* ── AKHIR WRAPPER PDF ── */}
    </>
  );
}
