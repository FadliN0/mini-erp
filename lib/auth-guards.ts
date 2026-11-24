import { createClient } from '@/lib/supabaseServer'
import type { User } from '@supabase/supabase-js'

/**
 * Guard Server Actions mini-erp (cv-hjp-dms).
 *
 * Dipakai di baris pertama setiap Server Action:
 *   - requireUser()    → siapa pun yang sudah login (admin / atasan)
 *   - requireAtasan()  → hanya role 'atasan' (pembayaran, kelola user, target)
 *   - requireAdmin()   → hanya role 'admin' (input/edit/hapus data operasional)
 *   - requireRole([...]) → role lain bila nanti bertambah
 *
 * Ini melengkapi (bukan menggantikan) RLS Supabase — RLS tetap harus diaudit
 * per tabel karena skemanya belum ada di repo.
 */

export async function requireUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Belum login')
  return user
}

export async function requireRole(
  roles: string[],
): Promise<{ user: User; role: string }> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role?.toLowerCase() ?? ''
  if (!roles.map((r) => r.toLowerCase()).includes(role)) {
    throw new Error(`Akses ditolak: hanya ${roles.join(' / ')}`)
  }
  return { user, role }
}

export async function requireAtasan(): Promise<User> {
  const { user } = await requireRole(['atasan'])
  return user
}

export async function requireAdmin(): Promise<User> {
  const { user } = await requireRole(['admin'])
  return user
}

// Kompatibilitas: dipakai app/dashboard/users/actions.ts — perilaku sama.
export async function assertCanManageUsers(): Promise<User> {
  return requireAtasan()
}
