import { supabase } from './supabaseClient';

// ─── Kurumsal: eşleşen normal talepleri (sansürlü) çek ───────────────────────
export async function fetchMatchedRequests() {
  const { data, error } = await supabase.rpc('get_matched_requests');
  if (error) return { ok: false, error: error.message, data: [] };
  return { ok: true, data: data || [] };
}