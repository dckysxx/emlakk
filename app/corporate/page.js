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
import { findMatchesForListing } from '../utils/matching';

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

// ─── ID üretici ───────────────────────────────────────────────────────────────
let idCounter = 10;
const newId = () => `lst-${++idCounter}`;

export default function CorporateDashboard() {
  const [listings,         setListings]         = useState(INITIAL_LISTINGS);
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

  // ── Silinmiş / süresi dolmuş ilanları gizle ───────────────────────────────
  const visibleListings = useMemo(
    () => autoDeleteExpiredListings(listings).filter(l => !l.isDeleted),
    [listings]
  );

  // ── Eşleşmeler ────────────────────────────────────────────────────────────
  const listingMatches = useMemo(() => {
    const map = {};
    visibleListings.forEach(l => {
      map[l.id] = findMatchesForListing(l, MOCK_REQUESTS);
    });
    return map;
  }, [visibleListings]);

  const totalMatches = Object.values(listingMatches).flat().length;

  // ── İlan kaydet (yeni / düzenle) ──────────────────────────────────────────
  const handleSaveListing = (data) => {
    if (editListing) {
      setListings(prev => prev.map(l =>
        l.id === editListing.id
          ? { ...l, ...data, neighborhood: data.neighborhood || data.mahalle }
          : l
      ));
      showToast('✅ İlan güncellendi.');
    } else {
      const newListing = {
        id: newId(),
        ...data,
        neighborhood: data.neighborhood || data.mahalle,
        city: 'Tekirdağ', district: 'Çorlu',
        status: 'Aktif', views: 0,
        date: new Date().toLocaleDateString('tr-TR'),
        image: '',
        isDeleted: false,
        ...makeExpiryFields(90),
      };
      setListings(prev => [newListing, ...prev]);
      showToast('✅ İlan yayınlandı. 90 gün aktif kalacak.');
    }
    setShowFormModal(false);
    setEditListing(null);
  };

  const handleEdit = (listing) => {
    setEditListing(listing);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    setListings(prev => prev.filter(l => l.id !== id));
    showToast('🗑 İlan silindi.');
  };

  const handleRenew = (id) => {
    if (coinBalance < 20) {
      showToast('❌ Yetersiz coin bakiyesi.');
      return;
    }
    setCoinBalance(p => p - 20);
    setListings(prev => prev.map(l => {
      if (l.id !== id) return l;
      return {
        ...l,
        expiresAt: addDays(new Date(), 90).toISOString(),
        status: 'Aktif',
        isDeleted: false,
      };
    }));
    showToast('✅ İlan süresi 90 gün uzatıldı.');
  };

  const handleOpenCreate = () => {
    setEditListing(null);
    setShowFormModal(true);
  };

  // ── Coin ile iletişim aç ───────────────────────────────────────────────────
  const handleUnlock = (request, listing) => {
    const key = `${request.id}-${listing.id}`;
    if (unlockedContacts[key] || coinBalance < 50) return;
    setCoinBalance(p => p - 50);
    setUnlockedContacts(p => ({ ...p, [key]: true }));
    const exists = guests.find(g =>
      g.requestId === request.id && g.listingId === listing.id
    );
    if (!exists) {
      setGuests(p => [{
        id: `guest-${Date.now()}`,
        requestId:     request.id,
        listingId:     listing.id,
        firstName:     request.firstName,
        lastName:      request.lastName,
        phone:         request.phone,
        listingTitle:  listing.title,
        listingStatus: listing.status,
        listingType:   request.listingType,
        mahalle:       request.mahalle,
        odaSayisi:     request.odaSayisi,
        minBudget:     request.minButce,
        maxBudget:     request.maxButce,
        unlockedAt:    new Date().toLocaleDateString('tr-TR'),
      }, ...p]);
    }
  };

  // ── Misafir filtrele ───────────────────────────────────────────────────────
  const filteredGuests = useMemo(() => {
    let list = [...guests];
    if (guestSearch)
      list = list.filter(g =>
        g.listingTitle.toLowerCase().includes(guestSearch.toLowerCase()) ||
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(guestSearch.toLowerCase())
      );
    if (guestStatus !== 'Tümü')
      list = list.filter(g => g.listingStatus === guestStatus);
    if (guestSort === 'En eski')
      list = [...list].reverse();
    return list;
  }, [guests, guestSearch, guestStatus, guestSort]);

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{
            background: toast.startsWith('❌') ? '#FEE2E2' : '#D1FAE5',
            color:      toast.startsWith('❌') ? '#991B1B' : '#065F46',
            border:     toast.startsWith('❌') ? '1px solid #FECACA' : '1px solid #A7F3D0',
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
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399' }}
          >
            Kurumsal
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Coin — tıklanınca mağaza */}
          <button
            onClick={() => setShowCoinModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition hover:opacity-80"
            style={{
              background: 'rgba(251,191,36,0.12)',
              color: '#FBBF24',
              border: '1px solid rgba(251,191,36,0.25)',
            }}
          >
            🪙 {coinBalance} Coin
          </button>

          {/* Yeni İlan */}
          <button
            onClick={handleOpenCreate}
            className="text-white font-semibold px-4 py-2 rounded-xl transition text-sm hover:opacity-90"
            style={{
              background: 'linear-gradient(90deg,#10B981,#059669)',
              boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
            }}
          >
            + Yeni İlan
          </button>

          {/* Profil */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#10B981', color: '#fff' }}
            >
              RE
            </div>
            <span className="text-white text-sm font-medium hidden sm:block">
              Referans Emlak
            </span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Toplam İlan',         value: visibleListings.length,                                           color: '#2F80ED', bg: '#EFF6FF' },
            { label: 'Aktif İlan',          value: visibleListings.filter(l => l.status === 'Aktif').length,         color: '#10B981', bg: '#F0FDF4' },
            { label: 'Toplam Görüntülenme', value: visibleListings.reduce((a, l) => a + (l.views || 0), 0),          color: '#8B5CF6', bg: '#F5F3FF' },
            { label: 'Toplam Eşleşme',      value: totalMatches,                                                     color: '#F59E0B', bg: '#FFFBEB' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'ilanlar', label: `🏠 İlanlarım (${visibleListings.length})` },
            { key: 'misafir', label: `👥 Misafir (${guests.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={activeTab === tab.key
                ? { background: '#0D1B2A', color: '#fff', boxShadow: '0 2px 8px rgba(13,27,42,0.2)' }
                : { background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── İlanlar Grid ── */}
        {activeTab === 'ilanlar' && (
          <>
            {visibleListings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🏠</p>
                <p className="font-semibold" style={{ color: '#374151' }}>
                  Henüz ilan eklemediniz.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
                  style={{ background: 'linear-gradient(90deg,#10B981,#059669)' }}
                >
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
                    onViewMatches={l => setMatchModal({
                      listing: l,
                      matches: listingMatches[l.id] || [],
                    })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Misafir Sekmesi ── */}
        {activeTab === 'misafir' && (
          <div>
            {/* Filtreler */}
            <div
              className="rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end"
              style={{ background: '#fff', border: '1px solid #E5E7EB' }}
            >
              <div className="flex-1 min-w-40">
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Ara</p>
                <input
                  type="text"
                  placeholder="İlan veya kişi adı..."
                  value={guestSearch}
                  onChange={e => setGuestSearch(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ border: '1.5px solid #E5E7EB', background: '#F9FAFB' }}
                  onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                  onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')}
                />
              </div>

              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Durum</p>
                <div className="flex gap-1.5">
                  {['Tümü', 'Aktif', 'Pasif'].map(s => (
                    <button
                      key={s}
                      onClick={() => setGuestStatus(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={guestStatus === s
                        ? { background: '#0D1B2A', color: '#fff' }
                        : { background: '#F5F7FA', color: '#6B7280', border: '1px solid #E5E7EB' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Sırala</p>
                <div className="flex gap-1.5">
                  {['En yeni', 'En eski'].map(s => (
                    <button
                      key={s}
                      onClick={() => setGuestSort(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={guestSort === s
                        ? { background: '#0D1B2A', color: '#fff' }
                        : { background: '#F5F7FA', color: '#6B7280', border: '1px solid #E5E7EB' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredGuests.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>
                  {guests.length === 0
                    ? 'Henüz açılmış misafir yok.'
                    : 'Filtreyle eşleşen misafir bulunamadı.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredGuests.map(guest => (
                  <div
                    key={guest.id}
                    className="rounded-2xl p-5"
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 1px 4px rgba(13,27,42,0.05)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#0D1B2A' }}>
                          {guest.firstName} {guest.lastName}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#2F80ED' }}>
                          📞 {guest.phone}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={guest.listingStatus === 'Aktif'
                            ? { background: '#D1FAE5', color: '#059669' }
                            : { background: '#FEF3C7', color: '#D97706' }
                          }
                        >
                          {guest.listingStatus}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#D1FAE5', color: '#059669' }}
                        >
                          ✅ Bilgiler açıldı
                        </span>
                      </div>
                    </div>

                    <p className="text-xs mb-2 font-medium" style={{ color: '#6B7280' }}>
                      🏠 {guest.listingTitle}
                    </p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                      {[
                        { label: 'Tür',     value: guest.listingType },
                        { label: 'Mahalle', value: guest.mahalle },
                        { label: 'Oda',     value: guest.odaSayisi },
                        { label: 'Bütçe',   value: `₺${guest.minBudget} – ₺${guest.maxBudget}` },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
                          <p className="text-xs font-semibold" style={{ color: '#374151' }}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p
                      className="text-xs"
                      style={{
                        color: '#9CA3AF',
                        borderTop: '1px solid #F3F4F6',
                        paddingTop: '8px',
                      }}
                    >
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
        <CoinStoreModal
          onClose={() => setShowCoinModal(false)}
          coinBalance={coinBalance}
        />
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