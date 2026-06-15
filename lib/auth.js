import { supabase } from './supabaseClient';

// ─── Supabase hata mesajlarını Türkçeleştir ──────────────────────────────────
function translateError(message = '') {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (m.includes('already registered'))        return 'Bu e-posta adresiyle daha önce kayıt oluşturulmuş.';
  if (m.includes('user already registered'))   return 'Bu e-posta adresiyle daha önce kayıt oluşturulmuş.';
  if (m.includes('email not confirmed'))       return 'Lütfen e-posta adresinizi doğrulayın.';
  if (m.includes('password should be'))        return 'Şifre en az 6 karakter olmalıdır.';
  if (m.includes('unable to validate email'))  return 'Geçerli bir e-posta adresi girin.';
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

// ─── Bireysel kayıt ───────────────────────────────────────────────────────────
export async function signUpIndividual({ firstName, lastName, phone, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name:  lastName,
        phone:      phone,
        user_type:  'individual',
      },
    },
  });
  if (error) return { ok: false, error: translateError(error.message) };
  return { ok: true, data };
}

// ─── Bireysel giriş ───────────────────────────────────────────────────────────
export async function signInIndividual({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: translateError(error.message) };
  return { ok: true, data };
}

// ─── Kurumsal giriş ───────────────────────────────────────────────────────────
export async function signInCorporate({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: translateError(error.message) };

  // user_type kontrolü
  const userType = data?.user?.user_metadata?.user_type;
  if (userType !== 'corporate') {
    // Yanlış tipte giriş — oturumu kapat
    await supabase.auth.signOut();
    return { ok: false, error: 'Bu hesap kurumsal kullanıcı hesabı değildir.' };
  }
  return { ok: true, data };
}

// ─── Çıkış ────────────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: translateError(error.message) };
  return { ok: true };
}

// ─── Mevcut kullanıcıyı al ─────────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, user: null, userType: null };
  const user = session.user;
  return {
    session,
    user,
    userType: user?.user_metadata?.user_type || null,
  };
}

// ─── Auth değişikliklerini dinle ───────────────────────────────────────────────
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription; // .unsubscribe() ile durdurulabilir
}