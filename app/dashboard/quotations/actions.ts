'use server';

import { createClient } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import type { TablesUpdate } from '@/lib/database.types';
import { getErrorMessage } from "@/lib/errors";

type ActionResult = { success: boolean; error?: string };

export async function deleteQuotationAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/dashboard/quotations');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// Sinkronisasi harga / keterangan ke master produk (dipakai create & edit)
export async function updateProductFieldAction(
  productId: string,
  field: 'price' | 'remark',
  value: number | string,
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const patch: TablesUpdate<'products'> =
      field === 'price' ? { price: value as number } : { remark: value as string };
    const { error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', productId);
    if (error) throw error;
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}