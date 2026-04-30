'use client';

export default function ListingCard({ listing, isFavorite, onToggleFavorite }) {
  return (
    <div
      className="rounded-2xl overflow-hidden group transition-all duration-200 cursor-pointer"
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(13,27,42,0.06)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(13,27,42,0.13)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(13,27,42,0.06)'}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '190px' }}>
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Type Badge */}
        <span
          className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full"
          style={
            listing.type === 'Satılık'
              ? { background: '#2F80ED', color: '#fff' }
              : { background: '#059669', color: '#fff' }
          }
        >
          {listing.type}
        </span>
        {/* Favorite */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="font-semibold text-sm leading-snug mb-2 line-clamp-2"
          style={{ color: '#0D1B2A' }}
        >
          {listing.title}
        </h3>
        <p
          className="font-extrabold text-lg mb-3"
          style={{ color: '#2F80ED' }}
        >
          {listing.price}
        </p>
        <div
          className="flex items-center gap-3 text-xs pt-3"
          style={{ borderTop: '1px solid #F3F4F6', color: '#6B7280' }}
        >
          <span>🛏 {listing.rooms}</span>
          <span>📍 {listing.location}</span>
        </div>
      </div>
    </div>
  );
}