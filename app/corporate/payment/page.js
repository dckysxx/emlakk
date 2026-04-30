'use client';

/*
 * GÜVENLİK NOTU:
 * Gerçek ödeme entegrasyonunda kart bilgileri frontend veya
 * veritabanında saklanmamalıdır. Ödeme sağlayıcı (Iyzico, PayTR,
 * Stripe vb.) hosted checkout veya tokenization kullanılmalıdır.
 * Bu dosya yalnızca UI/UX akışını simüle etmektedir.
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Kart numarası formatla: "1234567890123456" → "1234 5678 9012 3456"
function formatCardNumber(val) {
  return val
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

// ─── Son kullanım tarihi formatla: "1225" → "12/25"
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function PaymentForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const coin  = searchParams.get('coin')  || '500';
  const price = searchParams.get('price') || '450';
  const pkg   = searchParams.get('pkg')   || 'pkg-500';

  const [form, setForm] = useState({
    cardNumber: '',
    expiry:     '',
    cvc:        '',
  });
  const [errors, setErrors]       = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [redirect, setRedirect]   = useState(false);

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    const rawCard = form.cardNumber.replace(/\s/g, '');
    if (rawCard.length !== 16)          e.cardNumber = 'Kart numarası 16 haneli olmalıdır.';
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) e.expiry = 'MM/YY formatında giriniz.';
    else {
      const [mm, yy] = form.expiry.split('/').map(Number);
      if (mm < 1 || mm > 12)            e.expiry = 'Geçersiz ay.';
      const now  = new Date();
      const exp  = new Date(2000 + yy, mm - 1);
      if (exp < now)                     e.expiry = 'Kartın son kullanım tarihi geçmiş.';
    }
    if (!/^\d{3}$/.test(form.cvc))      e.cvc = 'CVC 3 haneli olmalıdır.';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    // Paket bilgisini success sayfasına taşı
    sessionStorage.setItem('pending_payment', JSON.stringify({ coin, price, pkg }));

    setIsLoading(true);
    setRedirect(true);

    // Mock 3D Secure yönlendirme gecikmesi
    setTimeout(() => {
      router.push('/corporate/payment/success');
    }, 2000);
  };

  const labelStyle = { color: '#374151', fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' };
  const inputBase  = {
    width: '100%', borderRadius: '12px', padding: '10px 14px',
    fontSize: '14px', outline: 'none', transition: 'border 0.15s',
    background: '#fff', color: '#0D1B2A',
  };

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-10" style={{ background: '#F5F7FA' }}>
      <div className="w-full" style={{ maxWidth: '480px' }}>

        {/* Geri butonu */}
        <button
          onClick={() => router.push('/corporate')}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 transition hover:opacity-70"
          style={{ color: '#6B7280' }}
        >
          ← Kurumsal Panele Dön
        </button>

        {/* Satın Alma Özeti */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{
            background: 'linear-gradient(135deg,#0D1B2A,#1a3a5c)',
            boxShadow: '0 8px 32px rgba(13,27,42,0.2)',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>
            Satın Alma Özeti
          </p>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-white">
                  {Number(coin).toLocaleString('tr-TR')}
                </span>
                <span className="text-lg font-semibold" style={{ color: '#FBBF24' }}>🪙 Coin</span>
              </div>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Kurumsal ilan eşleşmelerinde iletişim bilgisi açmak için kullanılabilir.
              </p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                {Math.floor(Number(coin) / 50)} iletişim bilgisi açma hakkı
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-2xl font-extrabold text-white">
                {Number(price).toLocaleString('tr-TR')} ₺
              </p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>KDV dahil</p>
            </div>
          </div>
        </div>

        {/* Ödeme Formu */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(13,27,42,0.07)',
          }}
        >
          <h2 className="text-base font-bold mb-5" style={{ color: '#0D1B2A' }}>
            💳 Kart Bilgileri
          </h2>

          {/* Kart Numarası */}
          <div className="mb-4">
            <label style={labelStyle}>Kart Numarası</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={form.cardNumber}
              onChange={e => update('cardNumber', formatCardNumber(e.target.value))}
              style={{
                ...inputBase,
                border: `1.5px solid ${errors.cardNumber ? '#FCA5A5' : '#E5E7EB'}`,
                letterSpacing: '0.1em',
              }}
              onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
              onBlur={e => (e.target.style.border = `1.5px solid ${errors.cardNumber ? '#FCA5A5' : '#E5E7EB'}`)}
            />
            {errors.cardNumber && (
              <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.cardNumber}</p>
            )}
          </div>

          {/* Tarih + CVC */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label style={labelStyle}>Son Kullanım Tarihi</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={e => update('expiry', formatExpiry(e.target.value))}
                style={{
                  ...inputBase,
                  border: `1.5px solid ${errors.expiry ? '#FCA5A5' : '#E5E7EB'}`,
                }}
                onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                onBlur={e => (e.target.style.border = `1.5px solid ${errors.expiry ? '#FCA5A5' : '#E5E7EB'}`)}
              />
              {errors.expiry && (
                <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.expiry}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>CVC</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="•••"
                value={form.cvc}
                onChange={e => update('cvc', e.target.value.replace(/\D/g, '').slice(0, 3))}
                style={{
                  ...inputBase,
                  border: `1.5px solid ${errors.cvc ? '#FCA5A5' : '#E5E7EB'}`,
                  letterSpacing: '0.2em',
                }}
                onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                onBlur={e => (e.target.style.border = `1.5px solid ${errors.cvc ? '#FCA5A5' : '#E5E7EB'}`)}
              />
              {errors.cvc && (
                <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.cvc}</p>
              )}
            </div>
          </div>

          {/* 3D Secure Yönlendirme mesajı */}
          {redirect && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0"
              />
              <p className="text-xs font-semibold" style={{ color: '#1D4ED8' }}>
                Banka 3D Secure ödeme sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
          )}

          {/* Ödeme butonu */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: isLoading
                ? '#94a3b8'
                : 'linear-gradient(90deg,#2F80ED,#1a6fd4)',
              boxShadow: isLoading ? 'none' : '0 4px 16px rgba(47,128,237,0.4)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                İşleniyor...
              </>
            ) : (
              '🔒 3D Secure ile Öde'
            )}
          </button>

          {/* Güvenlik notu */}
          <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
            🔒 256-bit SSL şifrelemesi · Kart bilgileriniz saklanmaz
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7FA' }}>
        <p style={{ color: '#6B7280' }}>Yükleniyor...</p>
      </div>
    }>
      <PaymentForm />
    </Suspense>
  );
}