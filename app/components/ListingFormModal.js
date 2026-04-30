'use client';
import { useState } from 'react';

const MAHALLELER = [
  'Alipaşa','Cemaliye','Çobançeşme','Esentepe','Hıdırağa',
  'Hatip','Havuzlar','Hürriyet','Kazımiye','Kemalettin',
  'Muhittin','Nusratiye','Reşadiye','Rumeli','Şeyhsinan',
  'Şahpaz','Türkgücü','Zafer','Yenice','Önerler',
  'Seymen','Sarılar','Maksutlu',
];

const ODA      = ['1+0','1+1','2+1','3+1','4+1','5+1 ve üzeri'];
const ACCEPTED = ['image/jpeg','image/jpg','image/png','image/webp'];
const TITLE_MAX = 120;

const EMPTY = {
  title:'', type:'Satılık', price:'', mahalle:'', address:'',
  buildingAge:'', sqm:'', rooms:'', description:'',
};

// ─── Bu iki component DIŞARIDA tanımlanmalı ───────────────────────────────────
// İçeride tanımlanırsa her render'da yeniden oluşur,
// React farklı component tipi sanır, DOM'dan kaldırıp ekler → focus kaybolur.

function SectionTitle({ icon, text }) {
  return (
    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#2F80ED' }}>
      {icon} {text}
    </h3>
  );
}

function FieldWrap({ children, error }) {
  return (
    <div>
      {children}
      {error && (
        <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{error}</p>
      )}
    </div>
  );
}

// ─── Sabit stil objeleri — her render'da yeni obje oluşmasın ─────────────────
const BASE_INPUT_STYLE = {
  background: '#F9FAFB',
  color: '#0D1B2A',
};

const DISABLED_INPUT_STYLE = {
  background: '#F5F7FA',
  color: '#9CA3AF',
  cursor: 'not-allowed',
  border: '1.5px solid #E5E7EB',
};

function getInputStyle(hasError) {
  return {
    ...BASE_INPUT_STYLE,
    border: `1.5px solid ${hasError ? '#FCA5A5' : '#E5E7EB'}`,
  };
}

const INPUT_CLS  = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all";
const LABEL_CLS  = "block text-xs font-semibold mb-1.5";
const LABEL_STYLE = { color: '#374151' };

// ─────────────────────────────────────────────────────────────────────────────

export default function ListingFormModal({
  mode = 'create',
  initialData = null,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() =>
    initialData ? {
      title:       initialData.title        || '',
      type:        initialData.type         || 'Satılık',
      price:       initialData.price        || '',
      mahalle:     initialData.neighborhood || '',
      address:     initialData.address      || '',
      buildingAge: String(initialData.buildingAge || ''),
      sqm:         String(initialData.sqm   || ''),
      rooms:       initialData.rooms        || '',
      description: initialData.description  || '',
    } : { ...EMPTY }
  );

  const [photos,   setPhotos]   = useState([]);
  const [errors,   setErrors]   = useState({});
  const [photoErr, setPhotoErr] = useState('');

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }));
  };

  // ── Fotoğraf ──────────────────────────────────────────────────────────────
  const handlePhotos = (e) => {
    const files   = Array.from(e.target.files);
    const invalid = files.filter(f => !ACCEPTED.includes(f.type));
    if (invalid.length > 0) {
      setPhotoErr('Sadece JPG, PNG veya WEBP formatında dosya yükleyebilirsiniz.');
      return;
    }
    setPhotoErr('');
    setPhotos(prev => [...prev, ...files].slice(0, 10));
  };

  const removePhoto = (i) =>
    setPhotos(prev => prev.filter((_, idx) => idx !== i));

  // ── Validasyon ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())             e.title       = 'İlan başlığı zorunludur.';
    if (!form.type)                     e.type        = 'İşlem türü zorunludur.';
    if (!String(form.price).trim())     e.price       = 'Fiyat zorunludur.';
    if (!form.mahalle)                  e.mahalle     = 'Mahalle zorunludur.';
    if (!form.buildingAge)              e.buildingAge = 'Bina yaşı zorunludur.';
    else if (isNaN(Number(form.buildingAge)))
                                        e.buildingAge = 'Sayısal değer giriniz.';
    if (!form.sqm)                      e.sqm         = 'Metrekare zorunludur.';
    else if (isNaN(Number(form.sqm)))   e.sqm         = 'Sayısal değer giriniz.';
    if (!form.rooms)                    e.rooms       = 'Oda sayısı zorunludur.';
    if (!form.description.trim())       e.description = 'Açıklama zorunludur.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({
      ...form,
      neighborhood: form.mahalle,
      buildingAge:  Number(form.buildingAge),
      sqm:          Number(form.sqm),
      photoNames:   photos.map(p => p.name),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: '780px', maxHeight: '92vh',
          background: '#fff', borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.28)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between px-7 py-5 flex-shrink-0"
          style={{ background: '#0D1B2A' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'create' ? '🏠 Yeni İlan Oluştur' : '✏️ İlanı Düzenle'}
            </h2>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              İlanınızın detaylarını eksiksiz girin. Bireysel panelden gelen taleplerle otomatik eşleştirilecektir.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full ml-4 flex-shrink-0 transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
          >×</button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-7 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            {/* ── SOL KOLON ── */}
            <div className="flex flex-col gap-5">

              {/* Temel Bilgiler */}
              <div>
                <SectionTitle icon="📋" text="Temel Bilgiler" />
                <div className="flex flex-col gap-3">

                  {/* İlan Başlığı + karakter sayacı */}
                  <FieldWrap error={errors.title}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={LABEL_CLS} style={{ ...LABEL_STYLE, marginBottom: 0 }}>
                        İlan Başlığı <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: form.title.length >= TITLE_MAX ? '#EF4444' : '#9CA3AF',
                        }}
                      >
                        {form.title.length}/{TITLE_MAX}
                      </span>
                    </div>
                    <input
                      className={INPUT_CLS}
                      placeholder="Örn: Çorlu Merkezde 3+1 Satılık Daire"
                      value={form.title}
                      maxLength={TITLE_MAX}
                      onChange={e => set('title', e.target.value)}
                      style={getInputStyle(errors.title)}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${errors.title ? '#FCA5A5' : '#E5E7EB'}`)}
                    />
                  </FieldWrap>

                  {/* İşlem Türü */}
                  <FieldWrap error={errors.type}>
                    <label className={LABEL_CLS} style={LABEL_STYLE}>
                      İşlem Türü <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="flex gap-2">
                      {['Satılık', 'Kiralık'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set('type', opt)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                          style={form.type === opt
                            ? { background: '#2F80ED', color: '#fff', border: '2px solid #2F80ED' }
                            : { background: '#fff', color: '#6B7280', border: '2px solid #E5E7EB' }
                          }
                        >
                          {opt === 'Satılık' ? '🏠' : '🔑'} {opt}
                        </button>
                      ))}
                    </div>
                  </FieldWrap>

                  {/* Fiyat */}
                  <FieldWrap error={errors.price}>
                    <label className={LABEL_CLS} style={LABEL_STYLE}>
                      İlan Fiyatı <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                        style={{ color: '#9CA3AF' }}
                      >₺</span>
                      <input
                        className={INPUT_CLS}
                        placeholder="0"
                        value={form.price}
                        onChange={e => set('price', e.target.value.replace(/[^\d]/g, ''))}
                        style={{ ...getInputStyle(errors.price), paddingLeft: '28px' }}
                        onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                        onBlur={e => (e.target.style.border = `1.5px solid ${errors.price ? '#FCA5A5' : '#E5E7EB'}`)}
                      />
                    </div>
                  </FieldWrap>
                </div>
              </div>

              {/* Konum Bilgileri */}
              <div>
                <SectionTitle icon="📍" text="Konum Bilgileri" />
                <div className="flex flex-col gap-3">

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={LABEL_CLS} style={LABEL_STYLE}>İl</label>
                      <input
                        className={INPUT_CLS}
                        value="Tekirdağ"
                        disabled
                        style={DISABLED_INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS} style={LABEL_STYLE}>İlçe</label>
                      <input
                        className={INPUT_CLS}
                        value="Çorlu"
                        disabled
                        style={DISABLED_INPUT_STYLE}
                      />
                    </div>
                  </div>

                  {/* Mahalle */}
                  <FieldWrap error={errors.mahalle}>
                    <label className={LABEL_CLS} style={LABEL_STYLE}>
                      Mahalle <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      className={INPUT_CLS}
                      value={form.mahalle}
                      onChange={e => set('mahalle', e.target.value)}
                      style={{ ...getInputStyle(errors.mahalle), cursor: 'pointer', appearance: 'none' }}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${errors.mahalle ? '#FCA5A5' : '#E5E7EB'}`)}
                    >
                      <option value="">Mahalle seçiniz...</option>
                      {MAHALLELER.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </FieldWrap>

                  {/* Adres */}
                  <div>
                    <label className={LABEL_CLS} style={LABEL_STYLE}>
                      Açık Adres / Harita Linki
                    </label>
                    <input
                      className={INPUT_CLS}
                      placeholder="Sokak, bina no veya Google Maps linki"
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SAĞ KOLON ── */}
            <div className="flex flex-col gap-5">

              {/* Ev Detayları */}
              <div>
                <SectionTitle icon="🏡" text="Ev Detayları" />
                <div className="flex flex-col gap-3">

                  <div className="grid grid-cols-2 gap-2">
                    <FieldWrap error={errors.buildingAge}>
                      <label className={LABEL_CLS} style={LABEL_STYLE}>
                        Bina Yaşı <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        className={INPUT_CLS}
                        placeholder="Örn: 5"
                        value={form.buildingAge}
                        onChange={e => set('buildingAge', e.target.value)}
                        style={getInputStyle(errors.buildingAge)}
                        onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                        onBlur={e => (e.target.style.border = `1.5px solid ${errors.buildingAge ? '#FCA5A5' : '#E5E7EB'}`)}
                      />
                    </FieldWrap>

                    <FieldWrap error={errors.sqm}>
                      <label className={LABEL_CLS} style={LABEL_STYLE}>
                        Net m² <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        className={INPUT_CLS}
                        placeholder="Örn: 120"
                        value={form.sqm}
                        onChange={e => set('sqm', e.target.value)}
                        style={getInputStyle(errors.sqm)}
                        onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                        onBlur={e => (e.target.style.border = `1.5px solid ${errors.sqm ? '#FCA5A5' : '#E5E7EB'}`)}
                      />
                    </FieldWrap>
                  </div>

                  {/* Oda Sayısı */}
                  <FieldWrap error={errors.rooms}>
                    <label className={LABEL_CLS} style={LABEL_STYLE}>
                      Oda Sayısı <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ODA.map(o => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => set('rooms', o)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={form.rooms === o
                            ? { background: '#2F80ED', color: '#fff', border: '1.5px solid #2F80ED' }
                            : { background: '#fff', color: '#6B7280', border: '1.5px solid #E5E7EB' }
                          }
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </FieldWrap>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <SectionTitle icon="📝" text="İlan Açıklaması" />
                <FieldWrap error={errors.description}>
                  <textarea
                    rows={4}
                    placeholder="İlan hakkında detaylı bilgi yazın..."
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    className={INPUT_CLS}
                    style={{ ...getInputStyle(errors.description), resize: 'none' }}
                    onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                    onBlur={e => (e.target.style.border = `1.5px solid ${errors.description ? '#FCA5A5' : '#E5E7EB'}`)}
                  />
                </FieldWrap>
              </div>

              {/* Fotoğraflar */}
              <div>
                <SectionTitle icon="📷" text="Fotoğraflar" />
                <label
                  className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: '2px dashed #CBD5E1',
                    background: '#F8FAFC',
                    padding: '20px',
                    minHeight: '80px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.border = '2px dashed #2F80ED')}
                  onMouseLeave={e => (e.currentTarget.style.border = '2px dashed #CBD5E1')}
                >
                  <span className="text-2xl">📁</span>
                  <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                    Fotoğraf seç veya sürükle bırak
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    JPG, PNG, WEBP · Maks 10 fotoğraf
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handlePhotos}
                  />
                </label>

                {photoErr && (
                  <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{photoErr}</p>
                )}

                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {photos.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #BFDBFE' }}
                      >
                        📷 {p.name.length > 16 ? `${p.name.slice(0, 16)}...` : p.name}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="ml-1 hover:opacity-70"
                          style={{ color: '#EF4444', fontWeight: 'bold' }}
                        >×</button>
                      </div>
                    ))}
                    <span className="text-xs self-center" style={{ color: '#9CA3AF' }}>
                      {photos.length}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end gap-3 px-7 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #E5E7EB', background: '#fff' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-slate-100"
            style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)',
              boxShadow: '0 3px 12px rgba(47,128,237,0.35)',
            }}
          >
            {mode === 'create' ? '✅ İlanı Yayınla' : '💾 Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}