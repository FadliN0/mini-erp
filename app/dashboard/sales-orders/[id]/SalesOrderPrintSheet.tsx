import Image from "next/image";
import type { Tables } from "@/lib/database.types";
import type { SalesOrderItemWithProduct } from "./SalesOrderDetailClient";

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

type SalesOrderPrintSheetProps = {
  salesOrder: Tables<"sales_orders">;
  customer: Tables<"customers"> | null;
  address: Tables<"customer_addresses"> | null;
  items: SalesOrderItemWithProduct[];
};

// Lembar cetak Sales Order (satu dokumen A4). Dipisah dari
// SalesOrderDetailClient agar file induk fokus ke logika & panel kontrol.
export default function SalesOrderPrintSheet({
  salesOrder,
  customer,
  address,
  items,
}: SalesOrderPrintSheetProps) {
  return (
    <>
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
                  {new Date(salesOrder.created_at || new Date()).toLocaleDateString(
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
                    {item.discount ? (
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
                {"Harap diproses sesuai standard operasi perusahaan. Segera terbitkan Surat Jalan (Delivery Order) jika barang sudah siap."}
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
    </>
  );
}
