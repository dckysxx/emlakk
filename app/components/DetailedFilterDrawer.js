'use client';

const MAHALLELER = [
  'Alipaşa','Cemaliye','Çobançeşme','Esentepe','Hıdırağa',
  'Hatip','Havuzlar','Hürriyet','Kazımiye','Kemalettin',
  'Muhittin','Nusratiye','Reşadiye','Rumeli','Şeyhsinan',
  'Şahpaz','Türkgücü','Zafer','Yenice','Önerler',
  'Seymen','Sarılar','Maksutlu',
];

const BINA_YASI = ['0-5','5-10','10-20','20+'];
const FEATURES  = ['Balkon','Asansör','Otopark','Eşyalı','Site içinde','Güvenlik','Havuz'];

// ─── Dışarıda tanımlanan alt componentler (focus/remount sorunu önlenir) ──────

function DrawerSection({ title, children }) {
  return (
    <div className="pb-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#0D1B2A' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function ChipBtn({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={active
        ? { background: '#2F80ED', color: '#fff', border: '1.5px solid #2F80ED' }
        : { background: '#fff', color: '#6B7280', border: '1.5px solid #E5E7EB' }
      }
    >
      {label}
    </button>
  );
}

function NumInput({ placeholder, value, onChange, suffix }) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^\d]/g, ''))}
        className="w-full rounded-xl text-sm outline-none transition"
        style={{
          padding: suffix ? '9px 32px 9px 12px' : '9px 12px',
          border: '1.5px solid #E5E7EB',
          background: '#F9FAFB',
          color: '#0D1B2A',
        }}
        onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
        onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')}
      />
      {suffix && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
          style={{ color: '#9CA3AF' }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Ana Drawer ───────────────────────────────────────────────────────────────

export default function DetailedFilterDrawer({ open, onClose, filters, onChange, onApply, onClearDetailed }) {
  if (!open) return null;

  const toggleArr = (key, value) => {
    const current = filters[key] || [];
    onChange(key, current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(13,27,42,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Drawer panel — sağdan gelir */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: '360px',
          maxWidth: '95vw',
          background: '#fff',
          boxShadow: '-8px 0 40px rgba(13,27,42,0.2)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: '#0D1B2A' }}
        >
          <h2 className="text-sm font-bold text-white">🔍 Detaylı Filtreleme</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
          >×</button>
        </div>

        {/* İçerik — scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Fiyat Aralığı */}
          <DrawerSection title="Fiyat Aralığı (₺)">
            <div className="flex flex-col gap-2">
              <NumInput
                placeholder="Min fiyat"
                value={filters.minPrice || ''}
                onChange={v => onChange('minPrice', v)}
              />
              <NumInput
                placeholder="Max fiyat"
                value={filters.maxPrice || ''}
                onChange={v => onChange('maxPrice', v)}
              />
              {filters.minPrice && filters.maxPrice && (
                <p className="text-xs font-medium px-3 py-2 rounded-lg"
                  style={{ background: '#EFF6FF', color: '#2F80ED' }}>
                  ₺{Number(filters.minPrice).toLocaleString('tr-TR')} –
                  ₺{Number(filters.maxPrice).toLocaleString('tr-TR')}
                </p>
              )}
            </div>
          </DrawerSection>

          {/* Metrekare */}
          <DrawerSection title="Metrekare (m²)">
            <div className="grid grid-cols-2 gap-2">
              <NumInput
                placeholder="Min"
                value={filters.minM2 || ''}
                onChange={v => onChange('minM2', v)}
                suffix="m²"
              />
              <NumInput
                placeholder="Max"
                value={filters.maxM2 || ''}
                onChange={v => onChange('maxM2', v)}
                suffix="m²"
              />
            </div>
          </DrawerSection>

          {/* Bina Yaşı */}
          <DrawerSection title="Bina Yaşı">
            <div className="flex flex-wrap gap-2">
              {BINA_YASI.map(opt => (
                <ChipBtn
                  key={opt}
                  label={`${opt} yıl`}
                  active={filters.buildingAge === opt}
                  onClick={() => onChange('buildingAge', filters.buildingAge === opt ? '' : opt)}
                />
              ))}
            </div>
          </DrawerSection>

          {/* Mahalle */}
          <DrawerSection title="Mahalle (Çoklu Seçim)">
            <div
              className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1"
              style={{ scrollbarWidth: 'thin' }}
            >
              {MAHALLELER.map(m => (
                <label key={m} className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={filters.neighborhoods?.includes(m) || false}
                    onChange={() => toggleArr('neighborhoods', m)}
                    className="accent-blue-500 w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-sm" style={{ color: '#374151' }}>{m}</span>
                </label>
              ))}
            </div>
            {filters.neighborhoods?.length > 0 && (
              <p className="text-xs mt-2 font-medium" style={{ color: '#2F80ED' }}>
                {filters.neighborhoods.length} mahalle seçildi
              </p>
            )}
          </DrawerSection>

          {/* Ek Özellikler */}
          <DrawerSection title="Ek Özellikler">
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <ChipBtn
                  key={f}
                  label={f}
                  active={filters.features?.includes(f) || false}
                  onClick={() => toggleArr('features', f)}
                />
              ))}
            </div>
          </DrawerSection>

        </div>

        {/* Footer butonları */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #E5E7EB', background: '#fff' }}
        >
          <button
            type="button"
            onClick={onClearDetailed}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition hover:bg-red-50"
            style={{ border: '1.5px solid #FECACA', color: '#EF4444' }}
          >
            Temizle
          </button>
          <button
            type="button"
            onClick={() => { onApply(); onClose(); }}
            className="flex-2 py-3 px-6 rounded-xl text-white text-sm font-bold transition hover:opacity-90 active:scale-95"
            style={{
              flex: 2,
              background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)',
              boxShadow: '0 3px 12px rgba(47,128,237,0.35)',
            }}
          >
            Filtreleri Uygula →
          </button>
        </div>
      </div>
    </>
  );
}