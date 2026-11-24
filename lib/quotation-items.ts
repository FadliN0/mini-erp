// Tipe bersama untuk baris item quotation di form (create & edit) dan payload server action.

// Bentuk item yang dikirim ke server action (RPC create / generate SO).
export type QuotationItemPayload = {
  product_id: string;
  qty: number;
  unit_price: number;
  discount: number;
  total_price: number;
};

// Bentuk item di state form: data produk terdenormalisasi + field bantu UI
// (search = teks combobox part code, discountRaw = teks diskon apa adanya dari input).
export type QuotationFormItem = {
  product_id: string;
  part_code: string;
  part_name: string;
  unit: string;
  qty: number;
  unit_price: number;
  discount: number;
  discountRaw: string;
  remark: string;
  search: string;
  _db_price: number;
  _db_remark: string;
};

// Item awal dari server untuk form edit (search & discountRaw ditambah di client).
export type QuotationInitialItem = Omit<
  QuotationFormItem,
  "discountRaw" | "search"
>;
