'use server';

import { createClient } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';


export async function deleteSalesOrderAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from('sales_orders').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/sales-orders');
  return { success: true };
}