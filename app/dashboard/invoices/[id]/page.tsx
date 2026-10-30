import { createClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import InvoiceDetailClient from './InvoiceDetailClient';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  

  // 1. Ambil Invoice sekaligus relasi SO, Customer, dan Address dalam 1 langkah
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      sales_orders (*),
      customers (*),
      customer_addresses (*)
    `)
    .eq('id', id)
    .single();

  if (!invoice) notFound();

    // 2. Ambil History Pembayaran dan Item Invoice secara paralel
  const [{ data: paymentsHistory }, { data: invItemsData }] = await Promise.all([
    supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('invoice_items')
      .select(`
        id,
        so_item_id,
        qty_billed,
        unit_price,
        discount,
        total_price,
        item_note,
        sales_order_items (
          id,
          product_id,
          qty,
          products ( part_code, part_name, unit, remark )
        )
      `)
      .eq('invoice_id', id),
  ]);

  const { data: allAddresses } = await supabase
    .from('customer_addresses')
    .select('id, address_type, complete_address, pic_name, pic_phone')
    .eq('customer_id', invoice.customer_id)
    .order('created_at', { ascending: false });

  // 3. Mapping item berbasis invoice_items (tetap mempertahankan struktur prop untuk UI)
  const items = (invItemsData || []).map((invItem: any) => {
    const soItem = invItem.sales_order_items || {};
    return {
      id: soItem.id || invItem.so_item_id,
      product_id: soItem.product_id,
      products: soItem.products,
      qty: soItem.qty ?? invItem.qty_billed,
      invoice_item_id: invItem.id,
      qty_billed: invItem.qty_billed,
      unit_price: invItem.unit_price,   // Murni dari invoice_items
      discount: invItem.discount ?? 0,  // Murni dari invoice_items
      total_price: invItem.total_price, // Murni dari invoice_items
      item_note: invItem.item_note || '',
    };
  });

  // Pisahkan objek relasi agar prop invoice tetap bersih seperti sebelumnya
  const {
    sales_orders: salesOrder,
    customers: customer,
    customer_addresses: billingAddress,
    ...cleanInvoice
  } = invoice;

  return (
    <InvoiceDetailClient
      invoice={cleanInvoice}
      salesOrder={salesOrder}
      customer={customer}
      billingAddress={billingAddress}
      items={items}
      paymentsHistory={paymentsHistory || []}
      allAddresses={allAddresses || []}
    />
  );
}
