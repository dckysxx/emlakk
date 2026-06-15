import { supabase } from './supabaseClient';

// ─── Yeni talep oluştur ───────────────────────────────────────────────────────
export async function createRequest(form, userId) {
  const payload = {
    user_id:      userId,
    listing_type: form.listingType,
    first_name:   form.firstName || null,
    last_name:    form.lastName || null,
    phone:        form.phone || null,
    neighborhood: form.mahalle || null,
    building_age: form.binaYasi ? Number(form.binaYasi) : null,
    net_m2:       form.metrekare ? Number(form.metrekare) : null,
    rooms:        form.odaSayisi || null,
    min_budget:   form.minButceRaw ?? null,
    max_budget:   form.maxButceRaw ?? null,
    is_urgent:    !!form.isUrgent,
    status:       'active',
    // expires_at veritabanında otomatik now() + 60 gün
  };

  const { data, error } = await supabase
    .from('requests')
    .insert(payload)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ─── Kullanıcının kendi taleplerini çek ──────────────────────────────────────
export async function fetchMyRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: error.message, data: [] };
  return { ok: true, data: data || [] };
}

// ─── Talebi sil (soft delete) ─────────────────────────────────────────────────
export async function deleteRequest(id) {
  const { error } = await supabase
    .from('requests')
    .update({ status: 'deleted' })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}