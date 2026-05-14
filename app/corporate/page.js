'use client';
import { useState, useMemo } from 'react';
import {
  makeExpiryFields,
  autoDeleteExpiredListings,
  addDays,
} from '../utils/expiry';
import CorporateListingCard      from '../components/CorporateListingCard';
import ListingFormModal          from '../components/ListingFormModal';
import CoinStoreModal            from '../components/CoinStoreModal';
import MatchModal                from '../components/MatchModal';
import ProfileModal              from '../components/ProfileModal';
import UrgentRequestCard         from '../components/UrgentRequestCard';
import { findMatchesForListing } from '../utils/matching';

/*
 * Gerçek sistemde acil talepler Supabase Realtime / websocket /
 * backend event sistemi ile kurumsal panele canlı düşmelidir.
 */

// ─── Mock requests ────────────────────────────────────────────────────────────
const MOCK_REQUESTS = [
  {
    id: 'req-1', firstName: 'Ali', lastName: 'Yılmaz', phone: '05321234567',
    listingType: 'Satılık', il: 'Tekirdağ', ilce: 'Çorlu', mahalle: 'Reşadiye',
    odaSayisi: '3+1', binaYasi: '6', metrekare: '115',
    minButce: '2.500.000', maxButce: '3.200.000',
  },
  {
    id: 'req-2', firstName: 'Ayşe', lastName: 'Kara', phone: '05459876543',
    listingType: 'Kiralık', il: 'Tekirdağ', ilce: 'Çorlu', mahalle: 'Hürriyet',
    odaSayisi: '2+1', binaYasi: '10', metrekare: '80',
    minButce: '7.000', maxButce: '10.000',
  },
];

// ─── Mock acil talepler ───────────────────────────────────────────────────────
const INITIAL_URGENT = [
  {
    id: 'urgent-1', isUrgent: true,
    listingType: 'Satılık',
    firstName: 'Ali', lastName: 'Yılmaz', phone: '05321234567',
    neighborhood: 'Muhittin', rooms: '3+1',
    minBudget: '2.000.000 ₺', maxBudget: '3.000.000 ₺',
    createdAt: '12.04.2026', status: 'new',
  },
  {
    id: 'urgent-2', isUrgent: true,
    listingType: 'Kiralık',
    firstName: 'Fatma', lastName: 'Şahin', phone: '05509876543',
    neighborhood: 'Reşadiye', rooms: '2+1',
    minBudget: '8.000 ₺', maxBudget: '12.000 ₺',
    createdAt: '13.04.2026', status: 'new',
  },
  {
    id: 'urgent-3', isUrgent: true,
    listingType: 'Satılık',
    firstName: 'Mehmet', lastName: 'Demir', phone: '05361112233',
    neighborhood: 'Hürriyet', rooms: '4+1',
    minBudget: '5.000.000 ₺', maxBudget: '8.000.000 ₺',
    createdAt: '14.04.2026', status: 'new',
  },
];

// ─── Mock listings ────────────────────────────────────────────────────────────
const today = new Date();

const INITIAL_LISTINGS = [
  {
    id: 'lst-1', title: 'Çorlu Reşadiye 3+1 Satılık',
    price: '2800000', type: 'Satılık', status: 'Aktif',
    views: 142, date: '12 Nis 2026',
    city: 'Tekirdağ', district: 'Çorlu', neighborhood: 'Reşadiye',
    rooms: '3+1', buildingAge: 8, sqm: 120, description: 'Güzel daire.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
    isDeleted: false,
    createdAt: new Date(today.getTime() - 30 * 86400000).toISOString(),
    expiresAt: new Date(today.getTime() + 60 * 86400000).toISOString(),
  },
  {
    id: 'lst-2', title: 'Tekirdağ Hürriyet 2+1 Kiralık',
    price: '8500', type: 'Kiralık', status: 'Aktif',
    views: 89, date: '10 Nis 2026',
    city: 'Tekirdağ', district: 'Çorlu', neighborhood: 'Hürriyet',
    rooms: '2+1', buildingAge: 12, sqm: 85, description: 'Kiralık daire.',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
    isDeleted: false,
    createdAt: new Date(today.getTime() - 85 * 86400000).toISOString(),
    expiresAt: new Date(today.getTime() + 5 * 86400000).toISOString(),
  },
  {
    id: 'lst-3', title: 'Çorlu Kazımiye Dükkan Kiralık',
    price: '15000', type: 'Kiralık', status: 'Pasif',
    views: 23, date: '8 Nis 2026',
    city: 'Tekirdağ', district: 'Çorlu', neighborhood: 'Kazımiye',
    rooms: '2+1', buildingAge: 20, sqm: 200, description: 'Dükkan kiralık.',
    image: '',
    isDeleted: false,
    createdAt: new Date(today.getTime() - 95 * 86400000).toISOString(),
    expiresAt: new Date(today.getTime() - 5 * 86400000).toISOString(),
  },
];

let idCounter = 10;
const newId = () => `lst-${++idCounter}`;

// ─── Yeni acil talep ekle (frontend simülasyonu) ──────────────────────────────
// Gerçek sistemde bu fonksiyon Supabase Realtime event'i tetikler.
export function addUrgentRequest(request, setUrgentRequests, showToast) {
  setUrgentRequests(prev => [request, ...prev]);
  showToast('🔥 Yeni acil talep Fırsat Köşesi\'ne düştü.');
}

export default function CorporateDashboard() {
  const [listings,         setListings]         = useState(INITIAL_LISTINGS);
  const [urgentRequests,   setUrgentRequests]   = useState(INITIAL_URGENT);
  const [unlockedUrgent,   setUnlockedUrgent]   = useState({});
  const [coinBalance,      setCoinBalance]       = useState(250);
  const [unlockedContacts, setUnlockedContacts]  = useState({});
  const [guests,           setGuests]            = useState([]);

  const [showFormModal,    setShowFormModal]     = useState(false);
  const [editListing,      setEditListing]       = useState(null);
  const [showCoinModal,    setShowCoinModal]     = useState(false);
  const [showProfileModal, setShowProfileModal]  = useState(false);
  const [matchModal,       setMatchModal]        = useState(null);
  const [toast,            setToast]             = useState('');

  const [activeTab,        setActiveTab]         = useState('ilanlar');
  const [guestSearch,      setGuestSearch]       = useState('');
  const [guestStatus,      setGuestStatus]       = useState('Tümü');
  const [guestSort,        setGuestSort]         = useState('En yeni');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Açılmamış acil talep sayısı (badge için)
  const unreadUrgentCount = urgentRequests.filter(r => !unlockedUrgent[r.id]).length;

  // ── Acil talep coin ile aç ─────────────────────────────────────────────────
  const handleUnlockUrgent = (requestId) => {
    if (unlockedUrgent[requestId]) return;
    if (coinBalance < 50) {
      showToast('❌ Yetersiz coin bakiyesi.');
      return;
    }
    setCoinBalance(p => p - 50);
    setUnlockedUrgent(p => ({ ...p, [requestId]: true }));
    showToast('✅ Fırsat detayları açıldı.');
  };

  // ── Visible listings ───────────────────────────────────────────────────────
  const visibleListings = useMemo(
    () => autoDeleteExpiredListings(listings).filter(l => !l.isDeleted),
    [listings]
  );

  // ── Eşleşmeler ────────────────────────────────────────────────────────────
  const listingMatches = useMemo(() => {
    const map = {};
    visibleListings.forEach(l => { map[l.id] = findMatchesForListing(l, MOCK_REQUESTS); });
    return map;
  }, [visibleListings]);

  const totalMatches = Object.values(listingMatches).flat().length;

  // ── İlan işlemleri ─────────────────────────────────────────────────────────
  const handleSaveListing = (data) => {
    if (editListing) {
      setListings(prev => prev.map(l =>
        l.id === editListing.id
          ? { ...l, ...data, neighborhood: data.neighborhood || data.mahalle }
          : l
      ));
      showToast('✅ İlan güncellendi.');
    } else {
      setListings(prev => [{
        id: newId(), ...data,
        neighborhood: data.neighborhood || data.mahalle,
        city: 'Tekirdağ', district: 'Çorlu',
        status: 'Aktif', views: 0,
        date: new Date().toLocaleDateString('tr-TR'),
        image: '', isDeleted: false,
        ...makeExpiryFields(90),
      }, ...prev]);
      showToast('✅ İlan yayınlandı. 90 gün aktif kalacak.');
    }
    setShowFormModal(false);
    setEditListing(null);
  };

  const handleEdit   = (listing) => { setEditListing(listing); setShowFormModal(true); };
  const handleDelete = (id) => {
    if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    setListings(prev => prev.filter(l => l.id !== id));
    showToast('🗑 İlan silindi.');
  };
  const handleRenew = (id) => {
    if (coinBalance < 20) { showToast('❌ Yetersiz coin bakiyesi.'); return; }
    setCoinBalance(p => p - 20);
    setListings(prev => prev.map(l =>
      l.id !== id ? l : { ...l, expiresAt: addDays(new Date(), 90).toISOString(), status: 'Aktif', isDeleted: false }
    ));
    showToast('✅ İlan süresi 90 gün uzatıldı.');
  };

  // ── Coin ile match aç ──────────────────────────────────────────────────────
  const handleUnlock = (request, listing) => {
    const key = `${request.id}-${listing.id}`;
    if (unlockedContacts[key] || coinBalance < 50) return;
    setCoinBalance(p => p - 50);
    setUnlockedContacts(p => ({ ...p, [key]: true }));
    const exists = guests.find(g => g.requestId === request.id && g.listingId === listing.id);
    if (!exists) {
      setGuests(p => [{
        id: `guest-${Date.now()}`, requestId: request.id, listingId: listing.id,
        firstName: request.firstName, lastName: request.lastName, phone: request.phone,
        listingTitle: listing.title, listingStatus: listing.status, listingType: request.listingType,
        mahalle: request.mahalle, odaSayisi: request.odaSayisi,
        minBudget: request.minButce, maxBudget: request.maxButce,
        unlockedAt: new Date().toLocaleDateString('tr-TR'),
      }, ...p]);
    }
  };

  // ── Misafir filtre ─────────────────────────────────────────────────────────
  const filteredGuests = useMemo(() => {
    let list = [...guests];
    if (guestSearch) list = list.filter(g =>
      g.listingTitle.toLowerCase().includes(guestSearch.toLowerCase()) ||
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(guestSearch.toLowerCase())
    );
    if (guestStatus !== 'Tümü') list = list.filter(g => g.listingStatus === guestStatus);
    if (guestSort === 'En eski') list = [...list].reverse();
    return list;
  }, [guests, guestSearch, guestStatus, guestSort]);

  const TABS = [
    { key: 'ilanlar',  label: `🏠 İlanlarım (${visibleListings.length})` },
    { key: 'firsat',   label: `🔥 Fırsat Köşesi`, badge: unreadUrgentCount },
    { key: 'misafir',  label: `👥 Misafir (${guests.length})` },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{
            background: toast.startsWith('❌') ? '#FEE2E2' : toast.startsWith('🔥') ? '#FFFBEB' : '#D1FAE5',
            color:      toast.startsWith('❌') ? '#991B1B' : toast.startsWith('🔥') ? '#92400E' : '#065F46',
            border:     toast.startsWith('❌') ? '1px solid #FECACA' : toast.startsWith('🔥') ? '1px solid #FDE68A' : '1px solid #A7F3D0',
            whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}

      {/* ── Navbar ── */}
      <nav
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-40"
        style={{ background: '#0D1B2A', boxShadow: '0 2px 16px rgba(13,27,42,0.25)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">Ev Sor </span>
            <span style={{ color: '#2F80ED' }}>Bulsun</span>
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}>
            Kurumsal
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Coin */}
          <button onClick={() => setShowCoinModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition hover:opacity-80"
            style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.25)' }}>
            🪙 {coinBalance} Coin
          </button>

          {/* Fırsat Köşesi hızlı erişim */}
          {unreadUrgentCount > 0 && (
            <button
              onClick={() => setActiveTab('firsat')}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition hover:opacity-80"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              🔥 Fırsat Köşesi
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={{ background: '#F59E0B', color: '#fff' }}
              >
                {unreadUrgentCount}
              </span>
            </button>
          )}

          <button onClick={() => { setEditListing(null); setShowFormModal(true); }}
            className="text-white font-semibold px-4 py-2 rounded-xl transition text-sm hover:opacity-90"
            style={{ background: 'linear-gradient(90deg,#10B981,#059669)', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
            + Yeni İlan
          </button>

          <button onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#10B981', color: '#fff' }}>RE</div>
            <span className="text-white text-sm font-medium hidden sm:block">Referans Emlak</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Toplam İlan',         value: visibleListings.length,                               color: '#2F80ED', bg: '#EFF6FF' },
            { label: 'Aktif İlan',          value: visibleListings.filter(l=>l.status==='Aktif').length, color: '#10B981', bg: '#F0FDF4' },
            { label: 'Toplam Eşleşme',      value: totalMatches,                                          color: '#8B5CF6', bg: '#F5F3FF' },
            { label: 'Acil Talep',          value: urgentRequests.length,                                 color: '#F59E0B', bg: '#FFFBEB' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5"
              style={activeTab === tab.key
                ? { background: '#0D1B2A', color: '#fff', boxShadow: '0 2px 8px rgba(13,27,42,0.2)' }
                : { background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB' }
              }
            >
              {tab.label}
              {tab.badge > 0 && (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-extrabold"
                  style={{ background: '#F59E0B', color: '#fff' }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── İlanlar Grid ── */}
        {activeTab === 'ilanlar' && (
          visibleListings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🏠</p>
              <p className="font-semibold" style={{ color: '#374151' }}>Henüz ilan eklemediniz.</p>
              <button onClick={() => { setEditListing(null); setShowFormModal(true); }}
                className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(90deg,#10B981,#059669)' }}>
                + İlk İlanınızı Ekleyin
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleListings.map(listing => (
                <CorporateListingCard
                  key={listing.id}
                  listing={listing}
                  matchCount={(listingMatches[listing.id] || []).length}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRenew={handleRenew}
                  onViewMatches={l => setMatchModal({ listing: l, matches: listingMatches[l.id] || [] })}
                />
              ))}
            </div>
          )
        )}

        {/* ── Fırsat Köşesi ── */}
        {activeTab === 'firsat' && (
          <div>
            {/* Başlık */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: 'linear-gradient(135deg,#0D1B2A,#1a3a5c)',
                boxShadow: '0 4px 20px rgba(13,27,42,0.15)',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <h2 className="text-lg font-extrabold text-white">Fırsat Köşesi</h2>
                    {unreadUrgentCount > 0 && (
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: '#F59E0B', color: '#fff' }}
                      >
                        {unreadUrgentCount} yeni
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    Acil öncelikli müşteri taleplerini burada görüntüleyebilirsiniz.
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}
                >
                  🪙 {coinBalance} Coin
                </div>
              </div>
            </div>

            {/* Kartlar */}
            {urgentRequests.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
                <p className="text-4xl mb-3">🔥</p>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>
                  Henüz acil talep bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {urgentRequests.map(req => (
                  <UrgentRequestCard
                    key={req.id}
                    request={req}
                    coinBalance={coinBalance}
                    onUnlock={handleUnlockUrgent}
                    isUnlocked={!!unlockedUrgent[req.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Misafir Sekmesi ── */}
        {activeTab === 'misafir' && (
          <div>
            <div className="rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end"
              style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
              <div className="flex-1 min-w-40">
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Ara</p>
                <input type="text" placeholder="İlan veya kişi adı..."
                  value={guestSearch} onChange={e => setGuestSearch(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
                  onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                  onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Durum</p>
                <div className="flex gap-1.5">
                  {['Tümü','Aktif','Pasif'].map(s => (
                    <button key={s} onClick={() => setGuestStatus(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={guestStatus === s
                        ? { background: '#0D1B2A', color: '#fff' }
                        : { background: '#F5F7FA', color: '#6B7280', border: '1px solid #E5E7EB' }
                      }>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Sırala</p>
                <div className="flex gap-1.5">
                  {['En yeni','En eski'].map(s => (
                    <button key={s} onClick={() => setGuestSort(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={guestSort === s
                        ? { background: '#0D1B2A', color: '#fff' }
                        : { background: '#F5F7FA', color: '#6B7280', border: '1px solid #E5E7EB' }
                      }>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {filteredGuests.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>
                  {guests.length === 0 ? 'Henüz açılmış misafir yok.' : 'Filtreyle eşleşen misafir bulunamadı.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredGuests.map(guest => (
                  <div key={guest.id} className="rounded-2xl p-5"
                    style={{ background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(13,27,42,0.05)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#0D1B2A' }}>
                          {guest.firstName} {guest.lastName}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#2F80ED' }}>📞 {guest.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={guest.listingStatus === 'Aktif'
                            ? { background: '#D1FAE5', color: '#059669' }
                            : { background: '#FEF3C7', color: '#D97706' }
                          }>{guest.listingStatus}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#D1FAE5', color: '#059669' }}>
                          ✅ Bilgiler açıldı
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mb-2 font-medium" style={{ color: '#6B7280' }}>🏠 {guest.listingTitle}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                      {[
                        { label: 'Tür',     value: guest.listingType },
                        { label: 'Mahalle', value: guest.mahalle },
                        { label: 'Oda',     value: guest.odaSayisi },
                        { label: 'Bütçe',   value: `₺${guest.minBudget} – ₺${guest.maxBudget}` },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
                          <p className="text-xs font-semibold" style={{ color: '#374151' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: '#9CA3AF', borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
                      📅 Açılma: {guest.unlockedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showFormModal && (
        <ListingFormModal
          mode={editListing ? 'edit' : 'create'}
          initialData={editListing}
          onClose={() => { setShowFormModal(false); setEditListing(null); }}
          onSave={handleSaveListing}
        />
      )}
      {showCoinModal && (
        <CoinStoreModal onClose={() => setShowCoinModal(false)} coinBalance={coinBalance} />
      )}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} corporate />
      )}
      {matchModal && (
        <MatchModal
          listing={matchModal.listing}
          matches={matchModal.matches}
          onClose={() => setMatchModal(null)}
          coinBalance={coinBalance}
          onUnlock={handleUnlock}
          unlockedContacts={unlockedContacts}
        />
      )}
    </div>
  );
}