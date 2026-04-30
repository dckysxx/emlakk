'use client';
import { useState } from 'react';
import {
  getDaysRemaining,
  getExpiryStatus,
  formatDate,
  makeExpiryFields,
} from '../utils/expiry';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_FAVORITES = [
  {
    id: 'fav-1',
    title: 'Çorlu Merkezde 2+1 Satılık Daire',
    price: '2.450.000 ₺',
    rooms: '2+1',
    sqm: 95,
    neighborhood: 'Reşadiye',
    type: 'Satılık',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  },
  {
    id: 'fav-2',
    title: 'Tekirdağ Deniz Manzaralı 3+1 Daire',
    price: '4.800.000 ₺',
    rooms: '3+1',
    sqm: 140,
    neighborhood: 'Hürriyet',
    type: 'Satılık',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80',
  },
  {
    id: 'fav-3',
    title: 'Çorlu Kiralık 1+1 Daire Kazımiye',
    price: '6.500 ₺/ay',
    rooms: '1+1',
    sqm: 55,
    neighborhood: 'Kazımiye',
    type: 'Kiralık',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
  },
];

const today = new Date();
const MOCK_REQUESTS = [
  {
    id: 'req-1',
    listingType: 'Satılık', neighborhood: 'Muhittin',
    rooms: '3+1', minBudget: '2.000.000 ₺', maxBudget: '3.000.000 ₺',
    status: 'Beklemede',
    ...makeExpiryFields(60),
    expiresAt: new Date(today.getTime() + 52 * 86400000).toISOString(),
  },
  {
    id: 'req-2',
    listingType: 'Kiralık', neighborhood: 'Reşadiye',
    rooms: '2+1', minBudget: '7.000 ₺', maxBudget: '10.000 ₺',
    status: 'İnceleniyor',
    ...makeExpiryFields(60),
    expiresAt: new Date(today.getTime() + 5 * 86400000).toISOString(),
  },
  {
    id: 'req-3',
    listingType: 'Satılık', neighborhood: 'Zafer',
    rooms: '4+1', minBudget: '5.000.000 ₺', maxBudget: '7.500.000 ₺',
    status: 'Tamamlandı',
    ...makeExpiryFields(60),
    expiresAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
  },
];

const STATUS_STYLE = {
  'Beklemede':   { bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
  'İnceleniyor': { bg: '#DBEAFE', color: '#2563EB', dot: '#3B82F6' },
  'Tamamlandı':  { bg: '#D1FAE5', color: '#059669', dot: '#10B981' },
};

// ─── Alt componentler — DIŞARIDA tanımlanmalı (focus/remount sorunu önlenir) ─

function FavoriteListingRow({ listing, onRemove }) {
  const handleClick = () => console.log('Favori ilan seçildi:', listing);

  return (
    <div
      className="flex rounded-2xl overflow-hidden transition-all duration-150"
      style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        minHeight: '110px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,27,42,0.1)';
        e.currentTarget.style.border = '1px solid #BFDBFE';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.border = '1px solid #E5E7EB';
      }}
    >
      {/* Görsel */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: '160px', minHeight: '110px', background: '#E2E8F0' }}
      >
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">🏠</span>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="flex-1 flex items-center justify-between px-4 py-3 min-w-0">
        <div className="flex-1 min-w-0 pr-3">
          {/* Tür badge */}
          <span
            className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5"
            style={listing.type === 'Satılık'
              ? { background: '#EFF6FF', color: '#2F80ED' }
              : { background: '#ECFDF5', color: '#10B981' }
            }
          >
            {listing.type}
          </span>

          <p
            className="font-bold text-sm leading-snug mb-1"
            style={{
              color: '#0D1B2A',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {listing.title}
          </p>

          <p className="font-extrabold text-base mb-1.5" style={{ color: '#2F80ED' }}>
            {listing.price}
          </p>

          <div className="flex items-center gap-3 flex-wrap" style={{ color: '#6B7280' }}>
            <span className="text-xs">🛏 {listing.rooms}</span>
            {listing.sqm && <span className="text-xs">📐 {listing.sqm} m²</span>}
            <span className="text-xs">📍 {listing.neighborhood}</span>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleClick}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80"
            style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #BFDBFE' }}
          >
            Detay →
          </button>
          <button
            onClick={() => onRemove(listing.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:bg-red-50"
            style={{ color: '#EF4444', border: '1px solid #FECACA' }}
          >
            🗑 Kaldır
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRequestRow({ request, onDelete }) {
  const daysLeft    = getDaysRemaining(request.expiresAt);
  const expiryState = getExpiryStatus(request.expiresAt);
  const statusStyle = STATUS_STYLE[request.status] || STATUS_STYLE['Beklemede'];

  const expiryBadge = {
    active:        { bg: '#D1FAE5', color: '#059669', text: `✅ ${daysLeft} gün kaldı` },
    expiring_soon: { bg: '#FEF3C7', color: '#D97706', text: `⚠️ ${daysLeft} gün kaldı` },
    expired:       { bg: '#FEE2E2', color: '#DC2626', text: '❌ Süresi Doldu' },
  }[expiryState];

  const handleDelete = () => {
    if (window.confirm('Bu talebi silmek istediğinize emin misiniz?'))
      onDelete(request.id);
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: '#F9FAFB',
        border: `1px solid ${
          expiryState === 'expired' ? '#FECACA'
          : expiryState === 'expiring_soon' ? '#FDE68A'
          : '#D1FAE5'
        }`,
      }}
    >
      {/* Üst satır */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={request.listingType === 'Satılık'
              ? { background: '#EFF6FF', color: '#2F80ED' }
              : { background: '#ECFDF5', color: '#10B981' }
            }
          >
            {request.listingType === 'Satılık' ? '🏠' : '🔑'} {request.listingType}
          </span>

          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: statusStyle.dot }}
            />
            {request.status}
          </span>

          {/* Süre badge */}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: expiryBadge.bg, color: expiryBadge.color }}
          >
            {expiryBadge.text}
          </span>
        </div>

        <button
          onClick={handleDelete}
          className="text-xs px-2.5 py-1 rounded-lg transition"
          style={{ color: '#EF4444', border: '1px solid transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEF2F2';
            e.currentTarget.style.border = '1px solid #FECACA';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.border = '1px solid transparent';
          }}
        >
          🗑 Sil
        </button>
      </div>

      {/* Detaylar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mb-3">
        {[
          { label: 'Mahalle',   value: `📍 ${request.neighborhood}` },
          { label: 'Oda',       value: `🛏 ${request.rooms}` },
          { label: 'Min Bütçe', value: `₺ ${request.minBudget}` },
          { label: 'Max Bütçe', value: `₺ ${request.maxBudget}` },
        ].map(item => (
          <div key={item.label}>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
            <p className="text-xs font-semibold" style={{ color: '#374151' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tarih */}
      <p className="text-xs pt-2.5" style={{ color: '#9CA3AF', borderTop: '1px solid #E5E7EB' }}>
        📅 Bitiş: {formatDate(request.expiresAt)}
        {expiryState === 'expiring_soon' && (
          <span className="ml-2 font-medium" style={{ color: '#D97706' }}>
            · ⏰ Talebinizin süresi yakında dolacak.
          </span>
        )}
      </p>
    </div>
  );
}

// ─── Ana Modal ────────────────────────────────────────────────────────────────
export default function ProfileModal({ onClose, favorites = [], corporate = false }) {
  const [activeTab, setActiveTab] = useState('favoriler');
  const [requests,  setRequests]  = useState(MOCK_REQUESTS);
  const [deleteMsg, setDeleteMsg] = useState(false);

  // Favorites: prop varsa onu kullan, yoksa mock
  const [favList, setFavList] = useState(
    favorites.length > 0 ? favorites : MOCK_FAVORITES
  );

  const handleDeleteRequest = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    setDeleteMsg(true);
    setTimeout(() => setDeleteMsg(false), 2500);
  };

  const handleRemoveFavorite = (id) => {
    setFavList(prev => prev.filter(f => f.id !== id));
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
          maxWidth: '960px',
          maxHeight: '88vh',
          background: '#fff',
          borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.28)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-7 py-4 flex-shrink-0"
          style={{ background: '#0D1B2A' }}
        >
          <h2 className="text-base font-bold text-white">👤 Profilim</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
          >×</button>
        </div>

        {/* ── Body: Sol + Sağ ── */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">

          {/* ── Sol Panel ── */}
          <div
            className="flex flex-col flex-shrink-0 p-6 gap-5"
            style={{
              width: '220px',
              minWidth: '220px',
              background: '#F9FAFB',
              borderRight: '1px solid #E5E7EB',
            }}
          >
            {/* Avatar */}
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold"
                style={{
                  background: corporate
                    ? 'linear-gradient(135deg,#10B981,#059669)'
                    : 'linear-gradient(135deg,#2F80ED,#1a6fd4)',
                }}
              >
                {corporate ? 'RE' : 'AY'}
              </div>

              <div>
                <p className="font-bold text-sm" style={{ color: '#0D1B2A' }}>
                  {corporate ? 'Referans Emlak' : 'Ali Yılmaz'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {corporate ? 'kurumsal@referansemlak.com' : 'ali@email.com'}
                </p>
                {!corporate && (
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    +90 532 000 0000
                  </p>
                )}
              </div>

              <button
                className="w-full py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
                style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #BFDBFE' }}
              >
                ✏️ Düzenle
              </button>
            </div>

            {/* Bireysel istatistik */}
            {!corporate && (
              <div className="flex flex-col gap-2">
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: '#fff', border: '1px solid #E5E7EB' }}
                >
                  <span className="text-xs" style={{ color: '#6B7280' }}>❤️ Favoriler</span>
                  <span className="text-xs font-bold" style={{ color: '#2F80ED' }}>{favList.length}</span>
                </div>
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: '#fff', border: '1px solid #E5E7EB' }}
                >
                  <span className="text-xs" style={{ color: '#6B7280' }}>📋 Talepler</span>
                  <span className="text-xs font-bold" style={{ color: '#10B981' }}>{requests.length}</span>
                </div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Çıkış */}
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:bg-red-50"
              style={{ border: '1px solid #FECACA', color: '#EF4444' }}
            >
              Çıkış Yap
            </button>
          </div>

          {/* ── Sağ Panel ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Sadece bireysel için tab */}
            {!corporate && (
              <div
                className="flex gap-1 px-5 py-3 flex-shrink-0"
                style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}
              >
                {[
                  { key: 'favoriler', label: `❤️ Favorilerim (${favList.length})` },
                  { key: 'talepler',  label: `📋 Taleplerim (${requests.length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={activeTab === tab.key
                      ? { background: '#0D1B2A', color: '#fff' }
                      : { color: '#6B7280', background: 'transparent' }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Silme başarı mesajı */}
            {deleteMsg && (
              <div
                className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 flex items-center gap-2"
                style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}
              >
                ✅ Talebiniz silindi.
              </div>
            )}

            {/* Scrollable içerik */}
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* FAVORİLER */}
              {!corporate && activeTab === 'favoriler' && (
                <div className="flex flex-col gap-3">
                  {favList.length > 0 ? (
                    favList.map(fav => (
                      <FavoriteListingRow
                        key={fav.id}
                        listing={fav}
                        onRemove={handleRemoveFavorite}
                      />
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">🤍</p>
                      <p className="font-semibold" style={{ color: '#374151' }}>
                        Henüz favori ilanınız bulunmuyor.
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        İlan kartlarındaki ❤️ ikonuna tıklayarak favorilere ekleyebilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TALEPLERİM */}
              {!corporate && activeTab === 'talepler' && (
                <div className="flex flex-col gap-3">
                  {/* Başlık */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 rounded-full" style={{ background: '#10B981' }} />
                    <h3 className="text-sm font-bold" style={{ color: '#10B981' }}>Taleplerim</h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: '#D1FAE5', color: '#059669' }}
                    >
                      {requests.length} talep
                    </span>
                  </div>

                  {requests.length > 0 ? (
                    requests.map(req => (
                      <UserRequestRow
                        key={req.id}
                        request={req}
                        onDelete={handleDeleteRequest}
                      />
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-3xl mb-2">📋</p>
                      <p className="font-semibold" style={{ color: '#374151' }}>
                        Henüz özel talebiniz bulunmuyor.
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        Ana sayfadaki "Özel Talep Formu Oluştur" butonunu kullanabilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* KURUMSAL */}
              {corporate && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🏢</p>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    Kurumsal hesap paneline ana ekrandan ulaşabilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}