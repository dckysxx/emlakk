'use client';
import { maskName, maskPhone } from '../utils/matching';

/*
 * Gerçek sistemde acil talepler Supabase Realtime / websocket /
 * backend event sistemi ile kurumsal panele canlı düşmelidir.
 */

export default function UrgentRequestCard({ request, coinBalance, onUnlock, isUnlocked }) {

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: '#fff',
        border: isUnlocked ? '1.5px solid #86EFAC' : '1.5px solid #FDE68A',
        boxShadow: isUnlocked
          ? '0 4px 16px rgba(16,185,129,0.1)'
          : '0 4px 16px rgba(245,158,11,0.1)',
      }}
    >
      {/* Üst şerit */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: isUnlocked ? '#F0FDF4' : '#FFFBEB' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background: '#F59E0B', color: '#fff' }}
          >
            🔥 Acil Talep
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={request.listingType === 'Satılık'
              ? { background: '#EFF6FF', color: '#2F80ED' }
              : { background: '#ECFDF5', color: '#10B981' }
            }
          >
            {request.listingType === 'Satılık' ? '🏠' : '🔑'} {request.listingType}
          </span>
        </div>

        {isUnlocked && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: '#D1FAE5', color: '#059669' }}
          >
            ✅ Detaylar Açıldı
          </span>
        )}
      </div>

      {/* Kart içeriği */}
      <div className="p-4">
        {/* Kişi bilgisi */}
        <div
          className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
          style={{ background: isUnlocked ? '#F0FDF4' : '#F9FAFB', border: '1px solid #E5E7EB' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: isUnlocked ? '#10B981' : '#E5E7EB', color: isUnlocked ? '#fff' : '#9CA3AF' }}
          >
            {isUnlocked
              ? `${request.firstName.charAt(0)}${request.lastName.charAt(0)}`
              : '🔒'
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#0D1B2A' }}>
              {isUnlocked
                ? `${request.firstName} ${request.lastName}`
                : maskName(request.firstName, request.lastName)
              }
            </p>
            <p className="text-xs mt-0.5" style={{ color: isUnlocked ? '#2F80ED' : '#9CA3AF' }}>
              📞 {isUnlocked ? request.phone : maskPhone(request.phone)}
            </p>
          </div>
          {!isUnlocked && (
            <span className="text-lg" style={{ color: '#D1D5DB' }}>🔒</span>
          )}
        </div>

        {/* Talep detayları */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-4">
          {[
            { label: 'Mahalle',    value: `📍 ${request.neighborhood}` },
            { label: 'Oda',        value: `🛏 ${request.rooms}` },
            { label: 'Min Bütçe',  value: `₺ ${request.minBudget}` },
            { label: 'Max Bütçe',  value: `₺ ${request.maxBudget}` },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
              <p className="text-xs font-semibold" style={{ color: '#374151' }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Tarih */}
        <p
          className="text-xs mb-4 pb-3"
          style={{ color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}
        >
          📅 {request.createdAt}
        </p>

        {/* Buton */}
        {!isUnlocked ? (
          <button
            onClick={() => onUnlock(request.id)}
            className="w-full py-3 rounded-xl text-white text-sm font-bold transition hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: coinBalance >= 50
                ? 'linear-gradient(90deg,#F59E0B,#D97706)'
                : '#D1D5DB',
              boxShadow: coinBalance >= 50 ? '0 3px 12px rgba(245,158,11,0.35)' : 'none',
              cursor: coinBalance >= 50 ? 'pointer' : 'not-allowed',
            }}
          >
            🪙 50 Coin ile Detayları Aç
          </button>
        ) : (
          <div
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{ background: '#D1FAE5', color: '#059669' }}
          >
            ✅ İletişim bilgileri açıldı
          </div>
        )}
      </div>
    </div>
  );
}