import type { Tables } from "@/lib/database.types";
import type { QuotationFormItem } from "@/lib/quotation-items";

// Daftar baris item pada form quotation — dipakai bersama oleh form Create
// dan Edit (markup & interaksi combobox part code identik). Satu-satunya
// perbedaan yang disengaja: varian input qty ("number" di Create,
// "text" berfilter digit di Edit), dipilih lewat prop qtyVariant.

type QuotationItemRowsProps = {
  items: QuotationFormItem[];
  qtyVariant: "number" | "text";
  openSearchIndex: number | null;
  highlightIndex: number;
  setOpenSearchIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setHighlightIndex: React.Dispatch<React.SetStateAction<number>>;
  setItems: React.Dispatch<React.SetStateAction<QuotationFormItem[]>>;
  getFilteredProducts: (search: string) => Tables<"products">[];
  handleProductSelect: (index: number, productId: string) => void;
  updateItemField: (
    index: number,
    field: keyof QuotationFormItem,
    value: string | number,
  ) => void;
  updateDiscount: (index: number, rawText: string) => void;
  updateProductField: (
    productId: string,
    field: "price" | "remark",
    value: number | string,
  ) => Promise<void>;
};

export default function QuotationItemRows({
  items,
  qtyVariant,
  openSearchIndex,
  highlightIndex,
  setOpenSearchIndex,
  setHighlightIndex,
  setItems,
  getFilteredProducts,
  handleProductSelect,
  updateItemField,
  updateDiscount,
  updateProductField,
}: QuotationItemRowsProps) {
              return items.map((item, idx) => {
              const lineTotal = item.qty * item.unit_price;
              const afterDisc =
                lineTotal - lineTotal * ((item.discount || 0) / 100);

              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center bg-white md:bg-slate-50/50 p-4 rounded-xl border border-slate-200 relative group transition-colors hover:border-blue-200"
                >
                  {/* Part Code (Searchable Combobox + Keyboard Nav) */}
                  <div className="md:col-span-2 relative">
                    <label className="md:hidden label-modern">Part Code</label>
                    <input
                      type="text"
                      required={!item.product_id}
                      value={item.search}
                      placeholder="Ketik part code..."
                      onChange={(e) => {
                        const val = e.target.value;
                        const newItems = [...items];
                        newItems[idx] = {
                          ...newItems[idx],
                          search: val,
                          product_id: "",
                          part_name: "",
                        };
                        setItems(newItems);
                        setOpenSearchIndex(idx);
                        setHighlightIndex(0); // 
                      }}
                      onFocus={() => {
                        setOpenSearchIndex(idx);
                        setHighlightIndex(0);
                      }}
                      onBlur={() =>
                        setTimeout(() => setOpenSearchIndex(null), 150)
                      }
                      onKeyDown={(e) => {
                        if (openSearchIndex !== idx) return;
                        const filtered = getFilteredProducts(item.search);

                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setHighlightIndex((prev) =>
                            Math.min(prev + 1, filtered.length - 1),
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setHighlightIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === "Enter") {
                          e.preventDefault(); // 👈 cegah form ter-submit
                          const chosen = filtered[highlightIndex];
                          if (chosen) handleProductSelect(idx, chosen.id);
                        } else if (e.key === "Escape") {
                          setOpenSearchIndex(null);
                        }
                      }}
                      className="input-modern py-2 font-mono text-xs"
                    />

                    {/* Dropdown hasil filter */}
                    {openSearchIndex === idx && item.search.trim() !== "" && (
                      <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                        {getFilteredProducts(item.search).map((p, i) => {
                          const isActive = i === highlightIndex; // 👈 baris yang disorot
                          return (
                            <button
                              type="button"
                              key={p.id}
                              // auto-scroll agar baris aktif selalu kelihatan
                              ref={(el) => {
                                if (isActive && el)
                                  el.scrollIntoView({ block: "nearest" });
                              }}
                              onMouseDown={() => handleProductSelect(idx, p.id)}
                              onMouseEnter={() => setHighlightIndex(i)} // 👈 selaras dgn mouse
                              className={`w-full text-left px-3 py-2 text-xs border-b border-slate-50 last:border-0 ${
                                isActive ? "bg-blue-100" : "hover:bg-blue-50"
                              }`}
                            >
                              <span className="font-mono font-bold text-slate-800">
                                {p.part_code}
                              </span>
                              <span className="text-slate-400 ml-2">
                                {p.part_name}
                              </span>
                            </button>
                          );
                        })}

                        {getFilteredProducts(item.search).length === 0 && (
                          <div className="px-3 py-2 text-xs text-slate-400">
                            Part code tidak ditemukan.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Deskripsi Barang */}
                  <div className="md:col-span-2">
                    <label className="md:hidden label-modern">Nama Part</label>
                    <input
                      type="text"
                      readOnly
                      value={item.part_name}
                      placeholder="Otomatis terisi..."
                      className="input-modern py-2 text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Qty & Price (Mobile Grid) */}
                  <div className="grid grid-cols-2 gap-3 md:col-span-3 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <label className="md:hidden label-modern text-center">
                        Qty
                      </label>
                      {qtyVariant === "number" ? (
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          updateItemField(
                            idx,
                            "qty",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="input-modern py-2 text-center text-xs font-bold"
                      />
                      ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1"
                        value={item.qty ? item.qty : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          updateItemField(
                            idx,
                            "qty",
                            digits ? parseInt(digits, 10) : 0,
                          );
                        }}
                        className="input-modern py-2 text-center text-xs font-bold"
                      />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="md:hidden label-modern">
                        Harga Satuan (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={
                            item.unit_price
                              ? item.unit_price.toLocaleString("id-ID")
                              : ""
                          }
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            updateItemField(
                              idx,
                              "unit_price",
                              digits ? parseInt(digits, 10) : 0,
                            );
                          }}
                          onBlur={(e) => {
                            const val =
                              parseInt(e.target.value.replace(/\D/g, ""), 10) ||
                              0;
                            // Update ke DB hanya jika nilainya berubah dari aslinya
                            if (item.product_id && val !== item._db_price) {
                              updateProductField(item.product_id, "price", val);
                              updateItemField(idx, "_db_price", val); // update tracking
                            }
                          }}
                          className="input-modern py-2 pl-9 text-right text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discount & Total */}
                  <div className="grid grid-cols-2 gap-3 md:col-span-2 items-center">
                    <div>
                      <label className="md:hidden label-modern">Diskon %</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={
                          item.discountRaw !== undefined
                            ? item.discountRaw
                            : item.discount
                              ? String(item.discount).replace(".", ",")
                              : ""
                        }
                        onChange={(e) => updateDiscount(idx, e.target.value)}
                        className="input-modern py-2 text-center text-xs font-bold text-rose-600 bg-rose-50 focus:bg-white border-rose-100 focus:border-rose-300"
                      />
                    </div>
                    <div className="text-right">
                      <label className="md:hidden label-modern text-right">
                        Subtotal
                      </label>
                      <span
                        className="font-black text-slate-800 text-sm truncate block"
                        title={`Rp ${afterDisc.toLocaleString("id-ID")}`}
                      >
                        {afterDisc.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Remark / Keterangan */}
                  <div className="md:col-span-2">
                    <label className="md:hidden label-modern">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Keterangan..."
                      value={item.remark || ""}
                      onChange={(e) =>
                        updateItemField(idx, "remark", e.target.value)
                      }
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (item.product_id && val !== item._db_remark) {
                          updateProductField(item.product_id, "remark", val);
                          updateItemField(idx, "_db_remark", val);
                        }
                      }}
                      className="input-modern py-2 text-xs"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 text-right md:text-center mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() =>
                        setItems(items.filter((_, i) => i !== idx))
                      }
                      disabled={items.length === 1}
                      className="w-full md:w-auto p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="md:hidden">Hapus Baris Ini</span>
                      <svg
                        className="hidden md:inline-block w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            });
}
