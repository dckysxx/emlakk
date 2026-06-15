'use client';
import { useState } from 'react';

const CURRENT_USER = {
  firstName: '',
  lastName:  '',
  phone:     '',
};

const MAHALLELER = [
  'Alipaşa','Cemaliye','Çobançeşme','Esentepe','Hıdırağa',
  'Hatip','Havuzlar','Hürriyet','Kazımiye','Kemalettin',
  'Muhittin','Nusratiye','Reşadiye','Rumeli','Şeyhsinan',
  'Şahpaz','Türkgücü','Zafer','Yenice','Önerler',
  'Seymen','Sarılar','Maksutlu',
];

const ODA_SECENEKLERI = ['1+0','1+1','2+1','3+1','4+1','5+1 ve üzeri'];

function formatTL(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
}

function parseTL(formatted) {
  return Number(formatted.replace(/\./g, '').replace(',', '.')) || 0;
}

// ─── Dışarıda tanımlanan helper componentler (focus/remount sorunu önlenir) ───

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: '#374151' }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled, type = 'text', error }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
      style={{
        border: `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`,
        background: disabled ? '#F5F7FA' : '#fff',
        color: disabled ? '#9CA3AF' : '#0D1B2A',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
      onFocus={e => { if (!disabled) e.target.style.border = '1.5px solid #2F80ED'; }}
      onBlur={e => { if (!disabled) e.target.style.border = `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`; }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, disabled, error }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all appearance-none"
      style={{
        border: `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`,
        background: disabled ? '#F5F7FA' : '#fff',
        color: value ? '#0D1B2A' : '#9CA3AF',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onFocus={e => { if (!disabled) e.target.style.border = '1.5px solid #2F80ED'; }}
      onBlur={e => { if (!disabled) e.target.style.border = `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`; }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}

function Section({ title, icon, children }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold" style={{ color: '#0D1B2A' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full relative"
        style={{
          maxWidth: '560px',
          background: '#fff',
          borderRadius: '1rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.25)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Ana Modal ────────────────────────────────────────────────────────────────

export default function RequestModal({ onClose, onSubmit }) {
  const needFirstName = !CURRENT_USER.firstName;
  const needLastName  = !CURRENT_USER.lastName;
  const needPhone     = !CURRENT_USER.phone;
  const needPersonal  = needFirstName || needLastName || needPhone;

  const [submitted, setSubmitted] = useState(false);
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    listingType: '',
    firstName:   CURRENT_USER.firstName,
    lastName:    CURRENT_USER.lastName,
    phone:       CURRENT_USER.phone,
    il:          'Tekirdağ',
    ilce:        'Çorlu',
    mahalle:     '',
    binaYasi:    '',
    metrekare:   '',
    odaSayisi:   '',
    minButce:    '',
    maxButce:    '',
    isUrgent:    false,
  });

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    if (submitError) setSubmitError('');
  };

  const handlePhone  = (val) => set('phone', val.replace(/\D/g, '').slice(0, 11));
  const handleBudget = (key, val) => set(key, formatTL(val));

  const validate = () => {
    const e = {};
    if (!form.listingType)                        e.listingType = 'İlan türü seçiniz.';
    if (needFirstName && !form.firstName.trim())  e.firstName   = 'Ad zorunludur.';
    if (needLastName  && !form.lastName.trim())   e.lastName    = 'Soyad zorunludur.';
    if (needPhone) {
      if (!form.phone.trim())                     e.phone = 'Telefon zorunludur.';
      else if (!/^(05\d{9})$/.test(form.phone))  e.phone = 'Geçerli bir Türkiye numarası girin (05XXXXXXXXX).';
    }
    if (!form.mahalle)   e.mahalle   = 'Mahalle seçiniz.';
    if (!form.odaSayisi) e.odaSayisi = 'Oda sayısı seçiniz.';
    if (!form.minButce)  e.minButce  = 'Minimum bütçe zorunludur.';
    if (!form.maxButce)  e.maxButce  = 'Maksimum bütçe zorunludur.';
    if (form.binaYasi  && isNaN(Number(form.binaYasi)))  e.binaYasi  = 'Sayısal değer giriniz.';
    if (form.metrekare && isNaN(Number(form.metrekare))) e.metrekare = 'Sayısal değer giriniz.';
    if (form.minButce && form.maxButce) {
      if (parseTL(form.minButce) > parseTL(form.maxButce))
        e.minButce = 'Minimum bütçe, maksimumdan büyük olamaz.';
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const payload = {
      ...form,
      firstName:   form.firstName || CURRENT_USER.firstName,
      lastName:    form.lastName  || CURRENT_USER.lastName,
      phone:       form.phone     || CURRENT_USER.phone,
      minButceRaw: parseTL(form.minButce),
      maxButceRaw: parseTL(form.maxButce),
    };

    // Kaydı page.js yapıyor (gerçek kullanıcı id'si orada)
    if (typeof onSubmit === 'function') {
      setLoading(true);
      setSubmitError('');
      const res = await onSubmit(payload);
      setLoading(false);
      if (res && !res.ok) {
        setSubmitError(res.error || 'Talep kaydedilemedi. Lütfen tekrar deneyin.');
        return;
      }
    }

    setSubmitted(true);
  };

  // ── Başarı ekranı ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Overlay onClose={onClose}>
        <div className="p-10 text-center flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
            style={{ background: form.isUrgent ? '#FFFBEB' : '#EFF6FF' }}
          >
            {form.isUrgent ? '🔥' : '✅'}
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#0D1B2A' }}>
            Talebiniz Alındı!
          </h3>
          {form.isUrgent && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-2"
              style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}
            >
              🔥 Talebiniz acil olarak işaretlendi ve öncelikli sıraya alındı.
            </div>
          )}
          <p className="text-sm" style={{ color: '#6B7280' }}>
            En kısa sürede sizinle iletişime geçeceğiz.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-7 px-8 py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
            style={{ background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)' }}
          >
            Kapat
          </button>
        </div>
      </Overlay>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <Overlay onClose={onClose}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ background: '#0D1B2A' }}
      >
        <div>
          <h2 className="text-base font-bold text-white">Özel Talep Formu</h2>
          <p className="text-xs" style={{ color: '#64748b' }}>Aradığınız evi bize anlatın</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
        >×</button>
      </div>

      {/* Scrollable body */}
      <div
        className="px-6 py-5 flex flex-col gap-4 overflow-y-auto"
        style={{ maxHeight: '68vh' }}
      >

        {/* Kayıt hatası */}
        {submitError && (
          <div className="px-4 py-3 rounded-xl text-xs font-semibold"
            style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
            ⚠️ {submitError}
          </div>
        )}

        {/* 1. İlan Türü */}
        <Section title="İlan Türü" icon="🏷️">
          <div>
            <div className="flex gap-3">
              {['Satılık', 'Kiralık'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set('listingType', opt)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2"
                  style={form.listingType === opt
                    ? { background: '#2F80ED', color: '#fff', border: '2px solid #2F80ED', boxShadow: '0 2px 10px rgba(47,128,237,0.3)' }
                    : { background: '#fff', color: '#6B7280', border: '2px solid #E5E7EB' }
                  }
                >
                  {opt === 'Satılık' ? '🏠' : '🔑'} {opt}
                </button>
              ))}
            </div>
            {errors.listingType && (
              <p className="text-xs mt-2" style={{ color: '#EF4444' }}>{errors.listingType}</p>
            )}
          </div>
        </Section>

        {/* 2. Kişisel Bilgiler (sadece eksik alanlar) */}
        {needPersonal && (
          <Section title="Kişisel Bilgiler" icon="👤">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {needFirstName && (
                <Field label="Ad" required error={errors.firstName}>
                  <TextInput
                    value={form.firstName}
                    onChange={v => set('firstName', v)}
                    placeholder="Adınız"
                    error={errors.firstName}
                  />
                </Field>
              )}
              {needLastName && (
                <Field label="Soyad" required error={errors.lastName}>
                  <TextInput
                    value={form.lastName}
                    onChange={v => set('lastName', v)}
                    placeholder="Soyadınız"
                    error={errors.lastName}
                  />
                </Field>
              )}
            </div>
            {needPhone && (
              <Field label="Telefon Numarası" required error={errors.phone}>
                <TextInput
                  value={form.phone}
                  onChange={handlePhone}
                  placeholder="05XXXXXXXXX"
                  type="tel"
                  error={errors.phone}
                />
              </Field>
            )}
          </Section>
        )}

        {/* 3. Konum */}
        <Section title="Konum Tercihi" icon="📍">
          <div className="grid grid-cols-2 gap-3">
            <Field label="İl">
              <TextInput value={form.il} onChange={() => {}} disabled />
            </Field>
            <Field label="İlçe">
              <TextInput value={form.ilce} onChange={() => {}} disabled />
            </Field>
          </div>
          <Field label="Mahalle" required error={errors.mahalle}>
            <SelectInput
              value={form.mahalle}
              onChange={v => set('mahalle', v)}
              options={MAHALLELER}
              placeholder="Mahalle seçiniz..."
              error={errors.mahalle}
            />
          </Field>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(47,128,237,0.07)', color: '#2F80ED', border: '1px solid rgba(47,128,237,0.15)' }}
          >
            🔒 Konum Tekirdağ / Çorlu ile sınırlıdır
          </div>
        </Section>

        {/* 4. Ev Özellikleri */}
        <Section title="Ev Özellikleri" icon="🏡">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bina Yaşı" error={errors.binaYasi}>
              <TextInput
                value={form.binaYasi}
                onChange={v => set('binaYasi', v)}
                placeholder="Örn: 5"
                error={errors.binaYasi}
              />
            </Field>
            <Field label="m²" error={errors.metrekare}>
              <TextInput
                value={form.metrekare}
                onChange={v => set('metrekare', v)}
                placeholder="Örn: 120"
                error={errors.metrekare}
              />
            </Field>
          </div>
          <Field label="Oda Sayısı" required error={errors.odaSayisi}>
            <div className="flex flex-wrap gap-2">
              {ODA_SECENEKLERI.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set('odaSayisi', opt)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={form.odaSayisi === opt
                    ? { background: '#2F80ED', color: '#fff', border: '1.5px solid #2F80ED', boxShadow: '0 2px 8px rgba(47,128,237,0.25)' }
                    : { background: '#fff', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
            {errors.odaSayisi && (
              <p className="text-xs" style={{ color: '#EF4444' }}>{errors.odaSayisi}</p>
            )}
          </Field>
        </Section>

        {/* 5. Bütçe */}
        <Section title="Bütçe Planı" icon="💰">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum Bütçe (₺)" required error={errors.minButce}>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: '#9CA3AF' }}
                >₺</span>
                <input
                  type="text"
                  value={form.minButce}
                  onChange={e => handleBudget('minButce', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    border: `1.5px solid ${errors.minButce ? '#FCA5A5' : '#E5E7EB'}`,
                    background: '#fff', color: '#0D1B2A',
                  }}
                  onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                  onBlur={e => (e.target.style.border = `1.5px solid ${errors.minButce ? '#FCA5A5' : '#E5E7EB'}`)}
                />
              </div>
            </Field>
            <Field label="Maksimum Bütçe (₺)" required error={errors.maxButce}>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: '#9CA3AF' }}
                >₺</span>
                <input
                  type="text"
                  value={form.maxButce}
                  onChange={e => handleBudget('maxButce', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    border: `1.5px solid ${errors.maxButce ? '#FCA5A5' : '#E5E7EB'}`,
                    background: '#fff', color: '#0D1B2A',
                  }}
                  onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                  onBlur={e => (e.target.style.border = `1.5px solid ${errors.maxButce ? '#FCA5A5' : '#E5E7EB'}`)}
                />
              </div>
            </Field>
          </div>

          {form.minButce && form.maxButce && parseTL(form.minButce) <= parseTL(form.maxButce) && (
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(47,128,237,0.07)', color: '#2F80ED', border: '1px solid rgba(47,128,237,0.15)' }}
            >
              <span>Bütçe aralığı</span>
              <span className="font-bold">₺{form.minButce} — ₺{form.maxButce}</span>
            </div>
          )}
        </Section>

        {/* 6. Acil Talep */}
        <div
          className="rounded-2xl p-4 transition-all duration-200"
          style={{
            background: form.isUrgent ? '#FFFBEB' : '#F9FAFB',
            border: `1.5px solid ${form.isUrgent ? '#FDE68A' : '#E5E7EB'}`,
          }}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isUrgent}
              onChange={e => set('isUrgent', e.target.checked)}
              className="mt-0.5 w-4 h-4 flex-shrink-0"
              style={{ accentColor: '#F59E0B' }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-bold" style={{ color: '#0D1B2A' }}>
                  🔥 Acil talep olarak işaretle
                </span>
                {form.isUrgent && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#F59E0B', color: '#fff' }}
                  >
                    Öncelikli Talep
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                Bu seçeneği işaretlerseniz talebiniz kurumsal kullanıcılara Fırsat Köşesi'nde öncelikli olarak gösterilir.
              </p>
            </div>
          </label>
        </div>

      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 flex gap-3"
        style={{ borderTop: '1px solid #E5E7EB', background: '#fff' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition hover:bg-gray-100"
          style={{ border: '1.5px solid #E5E7EB', color: '#6B7280', background: '#fff' }}
        >
          İptal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="py-3 px-8 rounded-xl text-white text-sm font-bold transition hover:opacity-90 active:scale-95"
          style={{
            flex: 2,
            background: loading
              ? '#94a3b8'
              : form.isUrgent
                ? 'linear-gradient(90deg,#F59E0B,#D97706)'
                : 'linear-gradient(90deg,#2F80ED,#1a6fd4)',
            boxShadow: loading ? 'none' : form.isUrgent
              ? '0 4px 14px rgba(245,158,11,0.35)'
              : '0 4px 14px rgba(47,128,237,0.35)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Gönderiliyor...' : (form.isUrgent ? '🔥 Acil Talebimi Gönder →' : 'Talebimi Gönder →')}
        </button>
      </div>

    </Overlay>
  );
}