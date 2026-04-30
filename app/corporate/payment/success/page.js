'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pending_payment');
      if (raw) {
        setPayment(JSON.parse(raw));
        sessionStorage.removeItem('pending_payment');
      }
    } catch {
      // sessionStorage erişim hatası
    }
  }, []);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F5F7FA' }}
    >
      <div
        className="w-full text-center"
        style={{ maxWidth: '420px' }}
      >
        {/* Başarı ikonu */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
          }}
        >
          ✅
        </div>

        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#0D1B2A' }}>
          Ödeme Başarılı
        </h1>
        <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
          Coin bakiyeniz güncellendi.
        </p>

        {/* Özet kart */}
        {payment && (
          <div
            className="rounded-2xl p-6 mb-8 text-left"
            style={{
              background: '#fff',
              border: '1px solid #D1FAE5',
              boxShadow: '0 4px 20px rgba(16,185,129,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <span className="text-sm font-semibold" style={{ color: '#6B7280' }}>Satın Alınan</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold" style={{ color: '#0D1B2A' }}>
                  {Number(payment.coin).toLocaleString('tr-TR')}
                </span>
                <span className="text-base font-bold" style={{ color: '#FBBF24' }}>🪙 Coin</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: '#6B7280' }}>Ödenen Tutar</span>
              <span className="text-sm font-bold" style={{ color: '#0D1B2A' }}>
                {Number(payment.price).toLocaleString('tr-TR')} ₺
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#6B7280' }}>Açma Hakkı</span>
              <span className="text-sm font-bold" style={{ color: '#10B981' }}>
                {Math.floor(Number(payment.coin) / 50)} iletişim bilgisi
              </span>
            </div>
          </div>
        )}

        {/* Panele dön */}
        <button
          onClick={() => router.push('/corporate')}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(90deg,#10B981,#059669)',
            boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
          }}
        >
          Kurumsal Panele Dön →
        </button>

        <p className="text-xs mt-4" style={{ color: '#9CA3AF' }}>
          İşlem No: #{Date.now().toString().slice(-8)}
        </p>
      </div>
    </main>
  );
}