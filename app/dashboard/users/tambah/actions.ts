'use server';
import { requireAtasan } from '@/lib/auth-guards';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { usernameToEmail } from '@/lib/auth-utils'


export async function createStaffAccount(
  username: string,
  password: string,
  role: string,
) {
  try {
    await requireAtasan();
    const cleanUsername = username.trim().toLowerCase();
    const email = usernameToEmail(username);

    const supabaseAdmin = createAdminClient();

    const {data: authData, error: authError} = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        throw Error( 'Username Sudah Dipakai');
    }
      throw Error(authError.message);
    }
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username: cleanUsername,
        role,
      });
      if (profileError) 
        throw new Error(profileError.message);
    }
    return { success: true, message: 'Akun Berhasil Dibuat'}
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
