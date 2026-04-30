'use client';
import { useState } from 'react';

const MAHALLELER = [
  'Alipaşa','Cemaliye','Çobançeşme','Esentepe','Hıdırağa',
  'Hatip','Havuzlar','Hürriyet','Kazımiye','Kemalettin',
  'Muhittin','Nusratiye','Reşadiye','Rumeli','Şeyhsinan',
  'Şahpaz','Türkgücü','Zafer','Yenice','Önerler',
  'Seymen','Sarılar','Maksutlu',
];

const ODA_OPTIONS      = ['1+0','1+1','2+1','3+1','4+1','5+1+'];
const BINA_YASI_OPTIONS = ['0-5','5-10','10-20','20+'];
const FEATURES         = ['Balkon','Asansör','Otopark','Eşyalı','Site içinde','Güvenlik','Havuz'];

// ─── Küçük yardımcı componentler — DIŞARIDA (remount önlenir) ────────────────

function SidebarSection({ title, icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #F1F5F9' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-left transition hover:opacity-70"
      >
        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#0D1B2A' }}>
          {icon} {title}
        </span>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function ChipButton({ label, active, onClick }) {
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

function PriceInput({ placeholder, value, onChange }) {
  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
        style={{ color: '#9CA3AF' }}
      >₺</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^\d]/g, ''))}
        className="w-full rounded-xl text-xs outline-none transition"
        style={{
          paddingLeft: '22px', paddingRight: '8px',
          paddingTop: '8px', paddingBottom: '8px',
          border: '1.5px solid #E5E7EB',
          background: '#F9FAFB', color: '#0D1B2A',
        }}
        onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
        onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')}
      />
    </div>
  );
}

function M2Input({ placeholder, value, onChange }) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^\d]/g, ''))}
        className="w-full rounded-xl text-xs outline-none transition"
        style={{
          padding: '8px 28px 8px 10px',
          border: '1.5px solid #E5E7EB',
          background: '#F9FAFB', color: '#0D1B2A',
        }}
        onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
        onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')}
      />
      <span
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
        style={{ color: '#9CA3AF' }}
      >m²</span>
    </div>
  );
}

// ─── Ana FilterSidebar ────────────────────────────────────────────────────────

export default function FilterSidebar({ filters, onChange, onClearAll, resultCount, mobileOpen, onMobileClose }) {
  const toggle = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange(key, next);
  };

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden' }}
    >
      {/* Filtre başlık */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: '#0D1B2A', borderRadius: '1rem 1rem 0 0' }}
      >
        <span className="text-sm font-bold text-white">🔍 Filtreler</span>
        <div className="flex items-center gap-2">
          {resultCount !== undefined && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(47,128,237,0.2)', color: '#7ec8ff' }}
            >
              {resultCount} ilan
            </span>
          )}
          {/* Mobil kapat */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="sm:hidden w-7 h-7 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            >×</button>
          )}
        </div>
      </div>

      {/* Filtre içerik — scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-2">

        {/* İlan Türü */}
        <SidebarSection title="İlan Türü" icon="🏷️">
          <div className="flex gap-2">
            {['Satılık','Kiralık'].map(opt => (
              <ChipButton
                key={opt}
                label={opt}
                active={filters.listingType === opt}
                onClick={() => onChange('listingType', filters.listingType === opt ? '' : opt)}
              />
            ))}
          </div>
        </SidebarSection>

        {/* Konum */}
        <SidebarSection title="Konum" icon="📍">
          <div className="flex flex-col gap-2 mb-2">
            {/* İl + İlçe kilitli */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1"
                style={{ background: '#F5F7FA', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                🔒 Tekirdağ
              </div>
              <div className="flex-1 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1"
                style={{ background: '#F5F7FA', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                🔒 Çorlu
              </div>
            </div>
          </div>

          {/* Mahalle çoklu seçim */}
          <p className="text-xs font-semibold mb-2" style={{ color: '#374151' }}>Mahalle</p>
          <div
            className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {MAHALLELER.map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={filters.neighborhoods?.includes(m) || false}
                  onChange={() => toggle('neighborhoods', m)}
                  className="accent-blue-500 w-3.5 h-3.5 flex-shrink-0"
                />
                <span className="text-xs" style={{ color: '#374151' }}>{m}</span>
              </label>
            ))}
          </div>
        </SidebarSection>

        {/* Fiyat */}
        <SidebarSection title="Fiyat Aralığı" icon="💰">
          <div className="flex flex-col gap-2">
            <PriceInput
              placeholder="Min fiyat"
              value={filters.minPrice}
              onChange={v => onChange('minPrice', v)}
            />
            <PriceInput
              placeholder="Max fiyat"
              value={filters.maxPrice}
              onChange={v => onChange('maxPrice', v)}
            />
          </div>
        </SidebarSection>

        {/* Oda Sayısı */}
        <SidebarSection title="Oda Sayısı" icon="🛏">
          <div className="flex flex-wrap gap-1.5">
            {ODA_OPTIONS.map(opt => (
              <ChipButton
                key={opt}
                label={opt}
                active={filters.rooms?.includes(opt) || false}
                onClick={() => toggle('rooms', opt)}
              />
            ))}
          </div>
        </SidebarSection>

        {/* Metrekare */}
        <SidebarSection title="Metrekare" icon="📐">
          <div className="flex flex-col gap-2">
            <M2Input
              placeholder="Min m²"
              value={filters.minM2}
              onChange={v => onChange('minM2', v)}
            />
            <M2Input
              placeholder="Max m²"
              value={filters.maxM2}
              onChange={v => onChange('maxM2', v)}
            />
          </div>
        </SidebarSection>

        {/* Bina Yaşı */}
        <SidebarSection title="Bina Yaşı" icon="🏗">
          <div className="flex flex-wrap gap-1.5">
            {BINA_YASI_OPTIONS.map(opt => (
              <ChipButton
                key={opt}
                label={`${opt} yıl`}
                active={filters.buildingAge === opt}
                onClick={() => onChange('buildingAge', filters.buildingAge === opt ? '' : opt)}
              />
            ))}
          </div>
        </SidebarSection>

        {/* Ek Özellikler */}
        <SidebarSection title="Özellikler" icon="✨" defaultOpen={false}>
          <div className="flex flex-col gap-1.5">
            {FEATURES.map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={filters.features?.includes(f) || false}
                  onChange={() => toggle('features', f)}
                  className="accent-blue-500 w-3.5 h-3.5 flex-shrink-0"
                />
                <span className="text-xs" style={{ color: '#374151' }}>{f}</span>
              </label>
            ))}
          </div>
        </SidebarSection>

      </div>

      {/* Temizle butonu */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid #F1F5F9' }}>
        <button
          type="button"
          onClick={onClearAll}
          className="w-full py-2.5 rounded-xl text-xs font-bold transition hover:opacity-80"
          style={{ background: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
        >
          🗑 Tüm Filtreleri Temizle
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sabit sidebar */}
      <div className="hidden sm:block flex-shrink-0" style={{ width: '240px' }}>
        <div className="sticky top-20" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          {sidebarContent}
        </div>
      </div>

      {/* Mobil: overlay drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex sm:hidden"
          style={{ background: 'rgba(13,27,42,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) onMobileClose(); }}
        >
          <div
            className="w-4/5 max-w-xs h-full overflow-hidden flex flex-col"
            style={{ background: '#fff', borderRadius: '0 1rem 1rem 0' }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}