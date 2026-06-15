import { supabase } from './supabaseClient';

// ─── Kurumsal kullanıcının kendi ilanlarını çek ──────────────────────────────
export async function fetchMyListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: error.message, data: [] };
  return { ok: true, data: data || [] };
}

// ─── Yeni ilan ekle ───────────────────────────────────────────────────────────
export async function createListing(form, corporateUserId) {
  const payload = {
    corporate_user_id: corporateUserId,
    title:        form.title,
    listing_type: form.type,
    price:        Number(form.price) || 0,
    neighborhood: form.neighborhood || form.mahalle || null,
    building_age: form.buildingAge ? Number(form.buildingAge) : null,
    net_m2:       form.sqm ? Number(form.sqm) : null,
    rooms:        form.rooms || null,
    description:  form.description || null,
    status:       'active',
    is_deleted:   false,
    // expires_at veritabanında otomatik now() + 90 gün
  };

  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ─── İlan güncelle ────────────────────────────────────────────────────────────
export async function updateListing(id, form) {
  const payload = {
    title:        form.title,
    listing_type: form.type,
    price:        Number(form.price) || 0,
    neighborhood: form.neighborhood || form.mahalle || null,
    building_age: form.buildingAge ? Number(form.buildingAge) : null,
    net_m2:       form.sqm ? Number(form.sqm) : null,
    rooms:        form.rooms || null,
    description:  form.description || null,
  };

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ─── İlan sil (soft delete) ───────────────────────────────────────────────────
export async function deleteListing(id) {
  const { error } = await supabase
    .from('listings')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── İlan süresini 90 gün uzat ────────────────────────────────────────────────
export async function renewListing(id) {
  const newExpiry = new Date(Date.now() + 90 * 86400000).toISOString();
  const { error } = await supabase
    .from('listings')
    .update({ expires_at: newExpiry, status: 'active' })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}