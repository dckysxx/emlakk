'use client';
import { useRouter } from 'next/navigation';

const PACKAGES = [
  {
    id: 'pkg-200',
    coin: 200,
    price: 150,
    label: 'Başlangıç',
    color: '#2F80ED',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    badge: null,
  },
  {
    id: 'pkg-500',
    coin: 500,
    price: 450,
    label: 'Popüler',
    color: '#10B981',
    bg: '#F0FDF4',
    border: '#86EFAC',
    badge: '⭐ En Çok Tercih',
  },
  {
    id: 'pkg-600',
    coin: 600,
    price: 550,
    label: 'Avantajlı',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#C4B5FD',
    badge: '💎 En Avantajlı',
  },
];

export default function CoinPackageModal({ onClose }) {
  const router = useRouter();

  const handleSelect = (pkg) => {
    // Paket bilgisini URL query param olarak taşı
    const params = new URLSearchParams({
      pkg:   pkg.id,
      coin:  pkg.coin,
      price: pkg.price,
    });
    onClose();
    router.push(`/corporate/payment?${params.toString()}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: '480px',
          background: '#fff',
          borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.28)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: '#0D1B2A' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">🪙 Coin Satın Al</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              İletişim bilgisi açmak için coin kullanılır
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
          >
            ×
          </button>
        </div>

        {/* Paketler */}
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#9CA3AF' }}>
            Paket Seçin
          </p>

          {PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className="rounded-2xl p-4 relative"
              style={{
                background: pkg.bg,
                border: `1.5px solid ${pkg.border}`,
              }}
            >
              {/* Badge */}
              {pkg.badge && (
                <span
                  className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: pkg.color, color: '#fff' }}
                >
                  {pkg.badge}
                </span>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
                    {pkg.label}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold" style={{ color: pkg.color }}>
                      {pkg.coin.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: pkg.color }}>
                      Coin
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                    Her bilgi açma = 50 coin ·{' '}
                    <span className="font-semibold" style={{ color: '#374151' }}>
                      {Math.floor(pkg.coin / 50)} açma hakkı
                    </span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className="text-xl font-extrabold" style={{ color: '#0D1B2A' }}>
                    {pkg.price.toLocaleString('tr-TR')} ₺
                  </span>
                  <button
                    onClick={() => handleSelect(pkg)}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-95 whitespace-nowrap"
                    style={{
                      background: pkg.color,
                      boxShadow: `0 3px 12px ${pkg.color}40`,
                    }}
                  >
                    Seç →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-center text-xs"
          style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6', color: '#9CA3AF' }}
        >
          🔒 256-bit SSL ile güvenli ödeme
        </div>
      </div>
    </div>
  );
}