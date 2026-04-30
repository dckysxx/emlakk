'use client';
import { useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const DOCUMENTS = [
  { key: 'vergiLevhasi',   label: 'Vergi Levhası',      icon: '🧾' },
  { key: 'imzaSirkuleri',  label: 'İmza Sirküleri',     icon: '✍️' },
  { key: 'odaKaydi',       label: 'Oda Kaydı',          icon: '🏛️' },
  { key: 'tisTasnBelgesi', label: 'Tis. Taşn. Belgesi', icon: '📋' },
];

function FileUploadCard({ label, icon, file, onSelect, error }) {
  const [formatError, setFormatError] = useState('');

  const handleChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFormatError('Sadece JPG, PNG veya PDF formatında dosya yükleyebilirsiniz.');
      e.target.value = '';
      return;
    }
    setFormatError('');
    onSelect(selected);
  };

  return (
    <div>
      <label
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all duration-150"
        style={{
          border: `2px dashed ${error || formatError ? '#FCA5A5' : file ? '#2F80ED' : '#CBD5E1'}`,
          background: file ? '#EFF6FF' : '#F8FAFC',
          minHeight: '100px',
        }}
      >
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold text-center" style={{ color: '#0D1B2A' }}>
          {label}
        </span>
        <span
          className="text-xs text-center truncate w-full text-center"
          style={{ color: file ? '#2F80ED' : '#94A3B8' }}
        >
          {file ? file.name : 'Dosya Seçilmedi'}
        </span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleChange}
        />
      </label>
      {(formatError || error) && (
        <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
          {formatError || error}
        </p>
      )}
    </div>
  );
}

export default function CorporateApplicationModal({ onClose }) {
  const [form, setForm] = useState({
    isim: '', soyisim: '', tc: '', email: '', sifre: '',
  });
  const [docs, setDocs] = useState({
    vergiLevhasi: null, imzaSirkuleri: null,
    odaKaydi: null,     tisTasnBelgesi: null,
  });
  const [errors,   setErrors]   = useState({});
  const [toast,    setToast]    = useState('');
  const [toastType, setToastType] = useState('error'); // 'error' | 'success'
  const [submitted, setSubmitted] = useState(false);

  const update = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const setDoc = (k, file) => {
    setDocs(p => ({ ...p, [k]: file }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const showToast = (msg, type = 'error') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 4000);
  };

  // ── Validasyon ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.isim.trim())                          e.isim    = 'İsim zorunludur.';
    if (!form.soyisim.trim())                       e.soyisim = 'Soyisim zorunludur.';
    if (!/^\d{11}$/.test(form.tc.replace(/\s/g,'')))
                                                    e.tc      = 'TC Kimlik Numarası 11 haneli olmalıdır.';
    if (!form.email.trim())                         e.email   = 'E-mail zorunludur.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                                    e.email   = 'Geçerli bir e-mail girin.';
    if (!form.sifre)                                e.sifre   = 'Şifre zorunludur.';
    else if (form.sifre.length < 6)                 e.sifre   = 'Şifre en az 6 karakter olmalıdır.';
    DOCUMENTS.forEach(({ key, label }) => {
      if (!docs[key]) e[key] = `${label} zorunludur.`;
    });
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      showToast('Lütfen tüm zorunlu alanları ve belgeleri eksiksiz doldurun.', 'error');
      return;
    }

    console.log('📋 Kurumsal Başvuru Gönderildi:', {
      ...form,
      belgeler: {
        vergiLevhasi:   docs.vergiLevhasi?.name,
        imzaSirkuleri:  docs.imzaSirkuleri?.name,
        odaKaydi:       docs.odaKaydi?.name,
        tisTasnBelgesi: docs.tisTasnBelgesi?.name,
      },
      tarih: new Date().toISOString(),
    });

    setSubmitted(true);
    showToast('Başvurunuz alınmıştır, incelemenin ardından sizinle iletişime geçilecektir.', 'success');
    setTimeout(() => onClose(), 3000);
  };

  const inputStyle = (hasError) => ({
    width: '100%', borderRadius: '10px',
    padding: '9px 13px', fontSize: '13px',
    outline: 'none', transition: 'border 0.15s',
    background: '#F9FAFB', color: '#0D1B2A',
    border: `1.5px solid ${hasError ? '#FCA5A5' : '#E2E8F0'}`,
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.7)', backdropFilter: 'blur(5px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{
            background: toastType === 'success' ? '#D1FAE5' : '#FEE2E2',
            color:      toastType === 'success' ? '#065F46' : '#991B1B',
            border:     `1px solid ${toastType === 'success' ? '#A7F3D0' : '#FECACA'}`,
            maxWidth: '420px', textAlign: 'center',
          }}
        >
          {toastType === 'success' ? '✅ ' : '⚠️ '}{toast}
        </div>
      )}

      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: '720px',
          maxHeight: '92vh',
          background: '#fff',
          borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-7 py-5 flex-shrink-0"
          style={{ background: '#0D1B2A' }}
        >
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              🏢 Kurumsal Üyelik Başvurusu
            </h2>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              Emlak ofisiniz veya şirketiniz için kurumsal profil oluşturarak ilan yayınlamaya başlayın.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ml-4 transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
          >×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            {/* ── Sol: Yetkili Bilgileri ── */}
            <div>
              <h3
                className="text-sm font-bold mb-4 flex items-center gap-2"
                style={{ color: '#2F80ED' }}
              >
                🪪 Yetkili Bilgileri
              </h3>

              <div className="flex flex-col gap-3">
                {/* İsim + Soyisim */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                      İsim <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      placeholder="İsim"
                      value={form.isim}
                      onChange={e => update('isim', e.target.value)}
                      style={inputStyle(errors.isim)}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${errors.isim ? '#FCA5A5' : '#E2E8F0'}`)}
                    />
                    {errors.isim && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.isim}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                      Soyisim <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      placeholder="Soyisim"
                      value={form.soyisim}
                      onChange={e => update('soyisim', e.target.value)}
                      style={inputStyle(errors.soyisim)}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${errors.soyisim ? '#FCA5A5' : '#E2E8F0'}`)}
                    />
                    {errors.soyisim && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.soyisim}</p>}
                  </div>
                </div>

                {/* TC */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    TC Kimlik Numarası <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    placeholder="11 haneli TC Kimlik No"
                    value={form.tc}
                    onChange={e => update('tc', e.target.value.replace(/\D/g,'').slice(0,11))}
                    style={inputStyle(errors.tc)}
                    onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                    onBlur={e => (e.target.style.border = `1.5px solid ${errors.tc ? '#FCA5A5' : '#E2E8F0'}`)}
                  />
                  {errors.tc && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.tc}</p>}
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    Giriş E-mail Adresi <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@firma.com"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    style={inputStyle(errors.email)}
                    onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                    onBlur={e => (e.target.style.border = `1.5px solid ${errors.email ? '#FCA5A5' : '#E2E8F0'}`)}
                  />
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.email}</p>}
                </div>

                {/* Şifre */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    Şifre Belirleyin <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="En az 6 karakter"
                    value={form.sifre}
                    onChange={e => update('sifre', e.target.value)}
                    style={inputStyle(errors.sifre)}
                    onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                    onBlur={e => (e.target.style.border = `1.5px solid ${errors.sifre ? '#FCA5A5' : '#E2E8F0'}`)}
                  />
                  {errors.sifre && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.sifre}</p>}
                </div>
              </div>
            </div>

            {/* ── Sağ: Resmî Belgeler ── */}
            <div>
              <h3
                className="text-sm font-bold mb-4 flex items-center gap-2"
                style={{ color: '#2F80ED' }}
              >
                📁 Resmî Belgeler (PDF, JPG, PNG)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {DOCUMENTS.map(({ key, label, icon }) => (
                  <FileUploadCard
                    key={key}
                    label={label}
                    icon={icon}
                    file={docs[key]}
                    onSelect={f => setDoc(key, f)}
                    error={errors[key]}
                  />
                ))}
              </div>

              <p className="text-xs mt-3" style={{ color: '#94A3B8' }}>
                * Tüm belgeler zorunludur. Kabul edilen formatlar: JPG, PNG, PDF
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-7 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #F1F5F9', background: '#fff' }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-slate-100"
            style={{ color: '#6B7280', border: '1px solid #E2E8F0' }}
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90 active:scale-95"
            style={{
              background: submitted ? '#94A3B8' : 'linear-gradient(90deg,#2F80ED,#1a6fd4)',
              boxShadow: submitted ? 'none' : '0 3px 12px rgba(47,128,237,0.35)',
              cursor: submitted ? 'not-allowed' : 'pointer',
            }}
          >
            📨 Başvuruyu Gönder
          </button>
        </div>
      </div>
    </div>
  );
}