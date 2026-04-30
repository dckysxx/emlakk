'use client';
import { useRouter } from 'next/navigation';

const PACKAGES = [
  {
    id: 'pkg-100', coin: 100, price: 150,
    label: 'Başlangıç Paketi', badge: null,
    btnText: 'Satın Al',
    color: '#2F80ED', bg: '#EFF6FF', border: '#BFDBFE',
    highlight: false,
  },
  {
    id: 'pkg-200', coin: 200, price: 250,
    label: 'Pro Emlakçı', badge: '⭐ Popüler Seçim',
    btnText: 'Ayrıcalıklı Al',
    color: '#10B981', bg: '#F0FDF4', border: '#6EE7B7',
    highlight: true,
  },
  {
    id: 'pkg-300', coin: 300, price: 350,
    label: 'Ultra Ticaret', badge: null,
    btnText: 'Satın Al',
    color: '#8B5CF6', bg: '#F5F3FF', border: '#C4B5FD',
    highlight: false,
  },
];

export default function CoinStoreModal({ onClose, coinBalance }) {
  const router = useRouter();

  const handleSelect = (pkg) => {
    const params = new URLSearchParams({
      pkg: pkg.id, coin: pkg.coin, price: pkg.price,
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
          maxWidth: '520px',
          background: '#fff',
          borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.28)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ background: '#0D1B2A' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">🪙 Jeton Mağazası</h2>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              Eşleştiğiniz yeni müşterilerle iletişime geçmek için hemen jeton paketi seçin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full ml-4 flex-shrink-0 transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
          >×</button>
        </div>

        {/* Mevcut bakiye */}
        <div
          className="px-6 py-3 flex items-center gap-2"
          style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#92400E' }}>
            🪙 Mevcut bakiye: <strong>{coinBalance} Coin</strong>
          </span>
        </div>

        {/* Paketler */}
        <div className="p-5 flex flex-col gap-3">
          {PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className="rounded-2xl p-4 relative"
              style={{
                background: pkg.bg,
                border: `${pkg.highlight ? '2px' : '1.5px'} solid ${pkg.border}`,
                boxShadow: pkg.highlight ? `0 4px 20px ${pkg.color}25` : 'none',
              }}
            >
              {pkg.badge && (
                <span
                  className="absolute -top-2.5 left-4 text-xs font-bold px-3 py-0.5 rounded-full"
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
                      {pkg.coin}
                    </span>
                    <span className="text-sm font-bold" style={{ color: pkg.color }}>Coin</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                    {Math.floor(pkg.coin / 50)} iletişim açma hakkı
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className="text-xl font-extrabold" style={{ color: '#0D1B2A' }}>
                    {pkg.price} ₺
                  </span>
                  <button
                    onClick={() => handleSelect(pkg)}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-95 whitespace-nowrap"
                    style={{
                      background: pkg.color,
                      boxShadow: `0 3px 12px ${pkg.color}40`,
                    }}
                  >
                    {pkg.btnText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="px-6 py-3 text-center text-xs"
          style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6', color: '#9CA3AF' }}
        >
          🔒 256-bit SSL ile güvenli ödeme
        </div>
      </div>
    </div>
  );
}