import { supabase } from './supabaseClient';

// ─── Giriş yapan kullanıcının profilini çek ──────────────────────────────────
export async function fetchMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Oturum bulunamadı.', data: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return { ok: false, error: error.message, data: null };
  return { ok: true, data };
}

// ─── Profili güncelle (ad, soyad, telefon) ───────────────────────────────────
export async function updateMyProfile({ firstName, lastName, phone }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName,
      last_name:  lastName,
      phone:      phone,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}