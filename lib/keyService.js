import { supabase } from './supabaseClient';

// ─── Anahtar bakiyesini getir ─────────────────────────────────────────────────
export async function fetchKeyBalance() {
  const { data, error } = await supabase.rpc('get_my_key_balance');
  if (error) return { ok: false, error: error.message, balance: 0 };
  return { ok: true, balance: data ?? 0 };
}

// ─── Eşleşen talebin iletişimini aç (atomik) ─────────────────────────────────
export async function unlockMatchedContact(requestId, listingId) {
  const { data, error } = await supabase.rpc('unlock_matched_contact', {
    p_request_id: requestId,
    p_listing_id: listingId,
  });
  if (error) return { ok: false, error: error.message };
  return data; // { ok, already?, first_name, last_name, phone } veya { ok:false, error }
}