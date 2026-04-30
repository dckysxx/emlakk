'use client';
import { useState } from 'react';
import { maskName, maskPhone } from '../utils/matching';

export default function MatchModal({ listing, matches, onClose, coinBalance, onUnlock, unlockedContacts }) {
  const [localMsg, setLocalMsg] = useState('');

  const handleUnlock = (match) => {
    const key = `${match.request.id}-${listing.id}`;
    if (unlockedContacts[key]) return;

    if (coinBalance < 50) {
      setLocalMsg('error:Yetersiz coin bakiyesi.');
      setTimeout(() => setLocalMsg(''), 2500);
      return;
    }
    onUnlock(match.request, listing);
    setLocalMsg('success:İletişim bilgileri açıldı.');
    setTimeout(() => setLocalMsg(''), 2500);
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
          maxWidth: '560px',
          maxHeight: '86vh',
          background: '#fff',
          borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.28)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: '#0D1B2A' }}
        >
          <div>
            <h2 className="text-sm font-bold text-white">🎯 Eşleşme Sonuçları</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {listing.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}
            >
              🪙 {coinBalance}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
            >×</button>
          </div>
        </div>

        {/* Feedback msg */}
        {localMsg && (
          <div
            className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0"
            style={localMsg.startsWith('success')
              ? { background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }
              : { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }
            }
          >
            {localMsg.startsWith('success') ? '✅ ' : '⚠️ '}
            {localMsg.split(':')[1]}
          </div>
        )}

        {/* Match count summary */}
        <div
          className="px-5 py-3 flex-shrink-0 flex items-center gap-2"
          style={{ background: '#F0FDF4', borderBottom: '1px solid #BBF7D0' }}
        >
          <span className="text-xs font-semibold" style={{ color: '#059669' }}>
            🎯 {matches.length} eşleşme bulundu
          </span>
          <span className="text-xs" style={{ color: '#6B7280' }}>
            · Her bilgi açma 50 coin harcatır
          </span>
        </div>

        {/* Match list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {matches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>Eşleşen talep bulunamadı.</p>
            </div>
          )}

          {matches.map((match) => {
            const key = `${match.request.id}-${listing.id}`;
            const isUnlocked = !!unlockedContacts[key];
            const req = match.request;

            return (
              <div
                key={key}
                className="rounded-2xl p-4"
                style={{
                  background: isUnlocked ? '#F0FDF4' : '#F9FAFB',
                  border: `1px solid ${isUnlocked ? '#86EFAC' : '#E5E7EB'}`,
                }}
              >
                {/* Üst: Ad + Skor + Unlocked badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0D1B2A' }}>
                      {isUnlocked
                        ? `${req.firstName} ${req.lastName}`
                        : maskName(req.firstName, req.lastName)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                      📞 {isUnlocked ? req.phone : maskPhone(req.phone)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#EFF6FF', color: '#2F80ED' }}
                    >
                      {match.score}/{match.maxScore} kriter eşleşti
                    </span>
                    {isUnlocked && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: '#D1FAE5', color: '#059669' }}
                      >
                        ✅ Bilgiler açıldı
                      </span>
                    )}
                  </div>
                </div>

                {/* Talep özeti */}
                <div
                  className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #E5E7EB' }}
                >
                  {[
                    { label: 'Tür',      value: req.listingType },
                    { label: 'Mahalle',  value: req.mahalle },
                    { label: 'Oda',      value: req.odaSayisi },
                    { label: 'Bütçe',    value: `₺${req.minButce} – ₺${req.maxButce}` },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
                      <p className="text-xs font-semibold" style={{ color: '#374151' }}>{item.value || '—'}</p>
                    </div>
                  ))}
                </div>

                {/* Eşleşen kriterler */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {match.details.map(d => (
                    <span
                      key={d}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#DBEAFE', color: '#1D4ED8' }}
                    >
                      ✓ {d}
                    </span>
                  ))}
                </div>

                {/* Buton */}
                {!isUnlocked && (
                  <button
                    onClick={() => handleUnlock(match)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition hover:opacity-90 active:scale-95"
                    style={{
                      background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)',
                      color: '#fff',
                      boxShadow: '0 3px 12px rgba(47,128,237,0.3)',
                    }}
                  >
                    🪙 50 Coin ile Bilgileri Aç
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}