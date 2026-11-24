'use server';

import { createClient } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import { getErrorMessage } from "@/lib/errors";

type ActionResult = { success: boolean; error?: string };

type BulkProduct = {
  part_code: string;
  part_name: string;
  unit: string;
  price: number;
  remark: string;
};

export async function bulkCreateProductsAction(
  payload: BulkProduct[],
): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await requireAdmin();
    const { error } = await supabase.from('products').insert(payload);
    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Ada Part Code duplikat yang terdeteksi oleh database.',
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