import { supabase } from './supabaseClient';

// ─── Kullanıcının favori ilan id'lerini çek ──────────────────────────────────
export async function fetchMyFavoriteIds() {
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id');

  if (error) return { ok: false, error: error.message, data: [] };
  return { ok: true, data: (data || []).map(r => r.listing_id) };
}

// ─── Favorileri ilan detaylarıyla birlikte çek (Profil > Favorilerim) ─────────
export async function fetchMyFavoriteListings() {
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id, listings(*)')
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: error.message, data: [] };
  // Sadece hâlâ var olan (silinmemiş) ilanları al
  const listings = (data || [])
    .map(r => r.listings)
    .filter(l => l && !l.is_deleted);
  return { ok: true, data: listings };
}

// ─── Favoriye ekle ────────────────────────────────────────────────────────────
export async function addFavorite(listingId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' };

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, listing_id: listingId });

  // Aynı favori tekrar eklenirse (unique constraint) sessizce geç
  if (error && !error.message.includes('duplicate')) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ─── Favoriden çıkar ──────────────────────────────────────────────────────────
export async function removeFavorite(listingId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' };

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}