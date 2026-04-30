'use client';

const TAG_LABELS = {
  listingType:  v => v,
  minPrice:     v => `Min ₺${Number(v).toLocaleString('tr-TR')}`,
  maxPrice:     v => `Max ₺${Number(v).toLocaleString('tr-TR')}`,
  minM2:        v => `Min ${v} m²`,
  maxM2:        v => `Max ${v} m²`,
  buildingAge:  v => `Bina: ${v} yıl`,
  neighborhoods:v => v,
  rooms:        v => v,
  features:     v => v,
};

export default function ActiveFilterTags({ filters, onRemove, onClearAll }) {
  const tags = [];

  if (filters.listingType) {
    tags.push({ key: 'listingType', value: filters.listingType, label: filters.listingType });
  }
  filters.neighborhoods?.forEach(n =>
    tags.push({ key: 'neighborhoods', value: n, label: `📍 ${n}` })
  );
  if (filters.minPrice)
    tags.push({ key: 'minPrice', value: filters.minPrice, label: `Min ₺${Number(filters.minPrice).toLocaleString('tr-TR')}` });
  if (filters.maxPrice)
    tags.push({ key: 'maxPrice', value: filters.maxPrice, label: `Max ₺${Number(filters.maxPrice).toLocaleString('tr-TR')}` });
  filters.rooms?.forEach(r =>
    tags.push({ key: 'rooms', value: r, label: `🛏 ${r}` })
  );
  if (filters.minM2)
    tags.push({ key: 'minM2', value: filters.minM2, label: `Min ${filters.minM2} m²` });
  if (filters.maxM2)
    tags.push({ key: 'maxM2', value: filters.maxM2, label: `Max ${filters.maxM2} m²` });
  if (filters.buildingAge)
    tags.push({ key: 'buildingAge', value: filters.buildingAge, label: `🏗 ${filters.buildingAge} yıl` });
  filters.features?.forEach(f =>
    tags.push({ key: 'features', value: f, label: `✓ ${f}` })
  );

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
        Aktif filtreler:
      </span>
      {tags.map((tag, i) => (
        <span
          key={`${tag.key}-${tag.value}-${i}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #BFDBFE' }}
        >
          {tag.label}
          <button
            onClick={() => onRemove(tag.key, tag.value)}
            className="hover:opacity-60 transition font-bold text-sm leading-none"
            style={{ color: '#2F80ED' }}
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="px-3 py-1.5 rounded-full text-xs font-semibold transition hover:opacity-80"
        style={{ background: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA' }}
      >
        🗑 Tümünü Temizle
      </button>
    </div>
  );
}