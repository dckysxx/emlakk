'use client';
import { useState } from 'react';
import DetailedFilterDrawer from './DetailedFilterDrawer';

const TYPE_OPTIONS = ['Tümü', 'Satılık', 'Kiralık'];
const ROOM_OPTIONS = ['Tümü', '1+0', '1+1', '2+1', '3+1', '4+1'];

// ─── Dışarıda tanımlanan chip (remount önlenir) ───────────────────────────────
function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
      style={active
        ? { background: '#2F80ED', color: '#fff', boxShadow: '0 2px 8px rgba(47,128,237,0.35)', border: '1px solid #2F80ED' }
        : { background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }
      }
    >
      {label}
    </button>
  );
}

export default function RequestAndFilterHero({ onOpenRequest, filters, onFilterChange, onClearDetailed }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Detaylı filtre sayısı (badge için)
  const detailedCount = [
    filters.minPrice, filters.maxPrice,
    filters.minM2, filters.maxM2,
    filters.buildingAge,
    ...(filters.neighborhoods || []),
    ...(filters.features || []),
  ].filter(Boolean).length;

  const updateType = (val) => {
    onFilterChange('listingType', filters.listingType === val || val === 'Tümü' ? '' : val);
  };

  const updateRooms = (val) => {
    if (val === 'Tümü') { onFilterChange('rooms', []); return; }
    const current = filters.rooms || [];
    onFilterChange('rooms',
      current.includes(val) ? current.filter(r => r !== val) : [...current, val]
    );
  };

  const activeType = filters.listingType || 'Tümü';
  const activeRooms = filters.rooms || [];

  return (
    <>
      <div
        className="w-full rounded-2xl overflow-hidden mb-8"
        style={{
          background: 'linear-gradient(135deg, #0D1B2A 0%, #1a3a5c 100%)',
          boxShadow: '0 8px 40px rgba(13,27,42,0.2)',
        }}
      >
        {/* ── CTA Bölümü ── */}
        <div className="px-6 sm:px-10 pt-8 pb-6 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(47,128,237,0.18)', color: '#7ec8ff', border: '1px solid rgba(47,128,237,0.3)' }}
          >
            ✨ Kişiselleştirilmiş Hizmet
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Hayalindeki Evi Bize Anlat
          </h2>
          <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
            Aradığınız evi bize anlatın, size en uygun ilanları bulalım.
          </p>

          <button
            type="button"
            onClick={onOpenRequest}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #2F80ED 0%, #1a6fd4 100%)',
              boxShadow: '0 4px 20px rgba(47,128,237,0.45)',
            }}
          >
            <span>📋</span>
            Özel Talep Formu Oluştur
          </button>
        </div>

        {/* ── Ayırıcı ── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 24px' }} />

        {/* ── Filtre Bölümü ── */}
        <div className="px-6 sm:px-10 py-5">
          {/* Başlık + Detaylı Filtreleme butonu */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
              İlanları Filtrele
            </p>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition hover:opacity-80"
              style={{
                background: 'rgba(47,128,237,0.18)',
                color: '#7ec8ff',
                border: '1px solid rgba(47,128,237,0.3)',
              }}
            >
              🔍 Detaylı Filtreleme
              {detailedCount > 0 && (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-extrabold"
                  style={{ background: '#2F80ED', color: '#fff' }}
                >
                  {detailedCount}
                </span>
              )}
            </button>
          </div>

          {/* Temel filtreler */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Tür */}
            <div className="flex-1">
              <p className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Tür</p>
              <div className="flex gap-2 flex-wrap">
                {TYPE_OPTIONS.map(opt => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    active={activeType === opt}
                    onClick={() => updateType(opt)}
                  />
                ))}
              </div>
            </div>

            {/* Konum kilitli */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>📍 Konum</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#64748b' }}
                >
                  Kilitli
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['Tekirdağ', 'Çorlu'].map(opt => (
                  <div
                    key={opt}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed select-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: '#64748b',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    🔒 {opt}
                  </div>
                ))}
              </div>
            </div>

            {/* Oda Sayısı */}
            <div className="flex-1">
              <p className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Oda Sayısı</p>
              <div className="flex gap-2 flex-wrap">
                {ROOM_OPTIONS.map(opt => (
                  <FilterChip
                    key={opt}
                    label={opt}
                    active={opt === 'Tümü' ? activeRooms.length === 0 : activeRooms.includes(opt)}
                    onClick={() => updateRooms(opt)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detaylı Filtre Drawer */}
      <DetailedFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={onFilterChange}
        onApply={() => setDrawerOpen(false)}
        onClearDetailed={onClearDetailed}
      />
    </>
  );
}