'use client';
import {
  getDaysRemaining,
  getExpiryStatus,
  formatDate,
} from '../utils/expiry';

function displayPrice(price, type) {
  const n = Number(price);
  if (!n) return `${price} ₺`;
  return type === 'Kiralık'
    ? `${n.toLocaleString('tr-TR')} ₺/ay`
    : `${n.toLocaleString('tr-TR')} ₺`;
}

export default function CorporateListingCard({
  listing, onEdit, onDelete, onViewMatches,
  matchCount = 0, onRenew,
}) {
  const daysLeft    = listing.expiresAt ? getDaysRemaining(listing.expiresAt) : null;
  const expiryState = listing.expiresAt ? getExpiryStatus(listing.expiresAt) : 'active';

  const expiryBadgeStyle = {
    active:        { bg: '#D1FAE5', color: '#059669', label: `✅ ${daysLeft} gün` },
    expiring_soon: { bg: '#FEF3C7', color: '#D97706', label: `⚠️ ${daysLeft} gün` },
    expired:       { bg: '#FEE2E2', color: '#DC2626', label: '❌ Süresi Doldu' },
  }[expiryState];

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
      style={{
        background: '#fff',
        border: expiryState === 'expired'
          ? '1.5px solid #FECACA'
          : matchCount > 0
            ? '1.5px solid #86EFAC'
            : '1px solid #E5E7EB',
        boxShadow: matchCount > 0
          ? '0 4px 20px rgba(16,185,129,0.12)'
          : '0 1px 4px rgba(13,27,42,0.06)',
        opacity: expiryState === 'expired' ? 0.75 : 1,
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(13,27,42,0.13)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = matchCount > 0
        ? '0 4px 20px rgba(16,185,129,0.12)'
        : '0 1px 4px rgba(13,27,42,0.06)')}
    >
      {/* Görsel */}
      <div className="relative overflow-hidden" style={{ height: '160px', background: '#F1F5F9' }}>
        {listing.image ? (
          <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
        )}

        {/* Sol badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={listing.type === 'Satılık'
              ? { background: '#2F80ED', color: '#fff' }
              : { background: '#10B981', color: '#fff' }
            }
          >
            {listing.type}
          </span>

          {/* Süre badge */}
          {listing.expiresAt && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: expiryBadgeStyle.bg, color: expiryBadgeStyle.color }}
            >
              {expiryBadgeStyle.label}
            </span>
          )}
        </div>

        {/* Eşleşme badge */}
        {matchCount > 0 && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: '#059669', color: '#fff' }}
          >
            🎯 {matchCount}
          </div>
        )}
      </div>

      {/* İçerik */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2" style={{ color: '#0D1B2A' }}>
          {listing.title}
        </h3>

        <p className="font-extrabold text-base mb-2" style={{ color: '#2F80ED' }}>
          {displayPrice(listing.price, listing.type)}
        </p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-2" style={{ color: '#6B7280' }}>
          {listing.sqm         && <span>📐 {listing.sqm} m²</span>}
          {listing.rooms       && <span>🛏 {listing.rooms}</span>}
          {listing.neighborhood && <span>📍 {listing.neighborhood}</span>}
        </div>

        {/* Tarih bilgisi */}
        {listing.expiresAt && (
          <div className="text-xs mb-2" style={{ color: '#9CA3AF' }}>
            📅 Bitiş: {formatDate(listing.expiresAt)}
          </div>
        )}

        {/* Süresi yaklaşan uyarı */}
        {expiryState === 'expiring_soon' && (
          <div
            className="px-3 py-2 rounded-lg mb-2 text-xs font-medium"
            style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
          >
            ⏰ İlan sürenizin bitmesine az kaldı.
          </div>
        )}

        {/* Süresi doldu uyarı */}
        {expiryState === 'expired' && (
          <div
            className="px-3 py-2 rounded-lg mb-2 text-xs font-medium"
            style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
          >
            ❌ Bu ilanın süresi doldu.
          </div>
        )}

        {/* Uzatma butonu */}
        {(expiryState === 'expiring_soon' || expiryState === 'expired') && onRenew && (
          <button
            onClick={() => onRenew(listing.id)}
            className="w-full py-2 rounded-xl text-xs font-bold mb-2 transition hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(90deg,#F59E0B,#D97706)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
            }}
          >
            🪙 20 Coin ile 90 Gün Uzat
          </button>
        )}

        {/* Aksiyon butonları */}
        <div className="flex gap-2 mt-auto flex-wrap">
          {matchCount > 0 && (
            <button
              onClick={() => onViewMatches(listing)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
              style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #86EFAC' }}
            >
              🎯 {matchCount} Eşleşme
            </button>
          )}
          <button
            onClick={() => onEdit(listing)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80"
            style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #BFDBFE' }}
          >
            ✏️ Düzenle
          </button>
          <button
            onClick={() => onDelete(listing.id)}
            className="py-1.5 px-3 rounded-lg text-xs font-semibold transition hover:bg-red-50"
            style={{ color: '#EF4444', border: '1px solid #FECACA' }}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}