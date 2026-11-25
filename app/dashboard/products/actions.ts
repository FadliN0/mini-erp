'use server';

import { createClient } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import { getErrorMessage } from "@/lib/errors";

type ActionResult = { success: boolean; error?: string };

type ProductPayload = {
  part_code: string;
  part_name: string;
  unit: string;
  price: number;
  remark: string;
};

export async function createProductAction(
  payload: ProductPayload,
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { error } = await supabase.from('products').insert([payload]);
    if (error) throw error;
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateProductAction(
  id: string,
  payload: ProductPayload,
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        'Gagal menghapus. Produk ini mungkin sedang digunakan di dokumen transaksi.',
    };
  }
}

export async function smartPasteUpsertAction(
  products: ProductPayload[],
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { error } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'part_code', ignoreDuplicates: false });
    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error:
            'Gagal: Ada Part Code yang sudah terdaftar di database (Duplikat).',
        };
      }
      throw error;
    }
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}