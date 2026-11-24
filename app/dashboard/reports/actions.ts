'use server';

import { createClient } from '@/lib/supabaseServer';
import { requireUser } from '@/lib/auth-guards';
import { getErrorMessage } from "@/lib/errors";
import type { Tables } from "@/lib/database.types";

type ReportResult<T> = { success: boolean; data?: T[]; error?: string };

// Baris hasil query riwayat barang (sales_order_items + relasi inner join)
export type ProductHistoryRow = Pick<
  Tables<"sales_order_items">,
  "qty" | "unit_price" | "total_price"
> & {
  products: Pick<Tables<"products">, "part_code" | "part_name" | "unit">;
  sales_orders: Pick<
    Tables<"sales_orders">,
    "so_number" | "created_at" | "customer_id"
  > & {
    customers: Pick<Tables<"customers">, "company_name"> | null;
  };
};

type TransactionsFilter = {
  startDate: string;
  endDate: string;
  customerId: string;
};

// Tarik laporan transaksi keuangan (Laporan Transaksi / SO)
export async function fetchTransactionsReportAction(
  filter: TransactionsFilter,
): Promise<ReportResult<Tables<"view_finance_reports">>> {
  const supabase = await createClient();
  try {
    await requireUser();
    let query = supabase
      .from('view_finance_reports')
      .select('*')
      .gte('so_date', filter.startDate)
      .lte('so_date', filter.endDate)
      .order('so_date', { ascending: false });

    if (filter.customerId) query = query.eq('customer_id', filter.customerId);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

type ProductHistoryFilter = {
  search: string;
  customerId: string;
};

// Tarik riwayat penjualan barang (Riwayat Barang)
export async function fetchProductHistoryAction(
  filter: ProductHistoryFilter,
): Promise<ReportResult<ProductHistoryRow>> {
  const supabase = await createClient();
  try {
    await requireUser();
    let query = supabase.from('sales_order_items').select(`
      qty, unit_price, total_price,
      products!inner(part_code, part_name, unit),
      sales_orders!inner(so_number, created_at, customer_id, customers(company_name))
    `);

    if (filter.search.trim()) {
      query = query.or(
        `part_code.ilike.%${filter.search}%,part_name.ilike.%${filter.search}%`,
        { foreignTable: 'products' },
      );
    }
    if (filter.customerId) {
      query = query.eq('sales_orders.customer_id', filter.customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}