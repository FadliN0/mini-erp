'use server'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { requireAtasan } from '@/lib/auth-guards'
import { getErrorMessage } from "@/lib/errors";

export async function getUsers() {
  try {
    await requireAtasan()                 // 🛡️ gerbang
    const supabaseAdmin = createAdminClient()     // 🧹 helper (bukan inline)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role')               // 📝 username, BUKAN email
      .order('username', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    await requireAtasan()                 // 🛡️ gerbang (WAJIB!)
    if (newPassword.length < 6) throw new Error('Password minimal 6 karakter')
    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })
    if (error) throw error
    return { success: true, message: 'Password berhasil diubah!' }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}