'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  autoDeleteExpiredListings,
} from '../utils/expiry';
import CorporateListingCard      from '../components/CorporateListingCard';
import ListingFormModal          from '../components/ListingFormModal';
import CoinStoreModal            from '../components/CoinStoreModal';
import MatchModal                from '../components/MatchModal';
import ProfileModal              from '../components/ProfileModal';
import UrgentRequestCard         from '../components/UrgentRequestCard';
import { signOut, getCurrentUser } from '../../lib/auth';
import {
  fetchMyListings,
  createListing,
  updateListing,
  deleteListing,
  renewListing,
} from '../../lib/listings';
import { fetchMatchedRequests } from '../../lib/matchService';
import { fetchKeyBalance, unlockMatchedContact } from '../../lib/keyService';

/*
 * Gerçek sistemde acil talepler Supabase Realtime / websocket /
 * backend event sistemi ile kurumsal panele canlı düşmelidir.
 */

// ─── Mock acil talepler (Fırsat Köşesi — henüz database'e bağlı değil) ────────
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

// ─── DB listing → UI ──────────────────────────────────────────────────────────
function dbToUiListing(row) {
  return {
    id:           row.id,
    title:        row.title,
    type:         row.listing_type,
    price:        String(row.price ?? ''),
    city:         row.city,
    district:     row.district,
    neighborhood: row.neighborhood,
    buildingAge:  row.building_age,
    sqm:          row.net_m2,
    rooms:        row.rooms,
    description:  row.description,
    status:       row.status === 'active' ? 'Aktif' : row.status === 'passive' ? 'Pasif' : 'Süresi Doldu',
    views:        0,
    image:        '',
    isDeleted:    row.is_deleted,
    createdAt:    row.created_at,
    expiresAt:    row.expires_at,
    date:         row.created_at ? new Date(row.created_at).toLocaleDateString('tr-TR') : '',
  };
}

function fmtMoney(v) {
  return v != null ? Number(v).toLocaleString('tr-TR') + ' ₺' : '—';
}

export default function CorporateDashboard() {
  const router = useRouter();

  // ── Auth + kullanıcı ─────────────────────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authChecked,   setAuthChecked]   = useState(false);

  // ── İlanlar (database) ─────────────────────────────────────────────────────
  const [listings,        setListings]        = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // ── Eşleşen talepler (database, sansürlü) ────────────────────────────────────
  const [matchedReqs,     setMatchedReqs]     = useState([]);
  const [loadingMatched,  setLoadingMatched]  = useState(true);

  // Açılan eşleşmeler: { ["<request_id>-<listing_id>"]: { first_name, last_name, phone } }
  const [unlockedMatched, setUnlockedMatched] = useState({});

  // ── Anahtar bakiyesi (artık DATABASE) ────────────────────────────────────────
  const [coinBalance, setCoinBalance] = useState(0);

  // ── Hâlâ mock olanlar (Fırsat Köşesi + Misafir) ──────────────────────────────
  const [urgentRequests,   setUrgentRequests]   = useState(INITIAL_URGENT);
  const [unlockedUrgent,   setUnlockedUrgent]   = useState({});
  const [unlockedContacts, setUnlockedContacts]  = useState({});
  const [guests,           setGuests]            = useState([]);

  // ── Modal state ────────────────────────────────────────────────────────────
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

  const [unlockingId, setUnlockingId] = useState(null); // hangi çift açılıyor (request-listing)

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Oturum koruması + kullanıcı id'sini al ───────────────────────────────────
  useEffect(() => {
    let mounted = true;
    getCurrentUser().then(({ user, userType }) => {
      if (!mounted) return;
      if (!user || userType !== 'corporate') {
        router.replace('/');
        return;
      }
      setCurrentUserId(user.id);
      setAuthChecked(true);
    });
    return () => { mounted = false; };
  }, [router]);

  // ── Anahtar bakiyesini çek ─────────────────────────────────────────────────
  const loadKeyBalance = async () => {
    const res = await fetchKeyBalance();
    if (res.ok) setCoinBalance(res.balance);
  };

  // ── İlanları çek ──────────────────────────────────────────────────────────────
  const loadListings = async () => {
    setLoadingListings(true);
    const res = await fetchMyListings();
    if (res.ok) setListings(res.data.map(dbToUiListing));
    else showToast('❌ İlanlar yüklenemedi.');
    setLoadingListings(false);
  };

  // ── Eşleşen talepleri çek ─────────────────────────────────────────────────────
  const loadMatchedRequests = async () => {
    setLoadingMatched(true);
    const res = await fetchMatchedRequests();
    if (res.ok) setMatchedReqs(res.data);
    setLoadingMatched(false);
  };

  useEffect(() => {
    if (authChecked && currentUserId) {
      loadKeyBalance();
      loadListings();
      loadMatchedRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, currentUserId]);

  // ── Gerçek çıkış ─────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const unreadUrgentCount = urgentRequests.filter(r => !unlockedUrgent[r.id]).length;

  // ── Eşleşen talep detayını aç (gerçek, atomik RPC) — ilan+talep çifti bazlı ──
  const handleUnlockMatched = async (req) => {
    const key = `${req.request_id}-${req.listing_id}`;
    if (unlockedMatched[key]) return; // bu çift zaten açık
    if (coinBalance < 50) { showToast('❌ Yetersiz anahtar bakiyesi.'); return; }

    setUnlockingId(key);
    const res = await unlockMatchedContact(req.request_id, req.listing_id);
    setUnlockingId(null);

    if (!res || !res.ok) {
      showToast(`❌ ${res?.error || 'İşlem başarısız.'}`);
      return;
    }

    setUnlockedMatched(prev => ({
      ...prev,
      [key]: {
        first_name: res.first_name,
        last_name:  res.last_name,
        phone:      res.phone,
      },
    }));

    if (!res.already) {
      await loadKeyBalance();
      showToast('✅ İletişim bilgileri açıldı.');
    } else {
      showToast('ℹ️ Bu talep zaten açılmıştı.');
    }
  };

  // ── Acil talep anahtar ile aç (mock — Fırsat Köşesi) ─────────────────────────
  const handleUnlockUrgent = (requestId) => {
    if (unlockedUrgent[requestId]) return;
    if (coinBalance < 50) { showToast('❌ Yetersiz anahtar bakiyesi.'); return; }
    setUnlockedUrgent(p => ({ ...p, [requestId]: true }));
    showToast('✅ Fırsat detayları açıldı.');
    // Not: Fırsat Köşesi henüz mock, gerçek anahtar düşümü sonraki adımda
  };

  // ── Visible listings ───────────────────────────────────────────────────────
  const visibleListings = useMemo(
    () => autoDeleteExpiredListings(listings).filter(l => !l.isDeleted),
    [listings]
  );

  // ── İlan işlemleri ─────────────────────────────────────────────────────────
  const handleSaveListing = async (data) => {
    if (editListing) {
      const res = await updateListing(editListing.id, data);
      if (!res.ok) { showToast('❌ İlan güncellenemedi.'); return; }
      showToast('✅ İlan güncellendi.');
    } else {
      const res = await createListing(data, currentUserId);
      if (!res.ok) { showToast('❌ İlan eklenemedi.'); return; }
      showToast('✅ İlan yayınlandı. 90 gün aktif kalacak.');
    }
    setShowFormModal(false);
    setEditListing(null);
    await loadListings();
  };

  const handleEdit = (listing) => { setEditListing(listing); setShowFormModal(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    const res = await deleteListing(id);
    if (!res.ok) { showToast('❌ İlan silinemedi.'); return; }
    showToast('🗑 İlan silindi.');
    await loadListings();
  };

  const handleRenew = async (id) => {
    if (coinBalance < 20) { showToast('❌ Yetersiz anahtar bakiyesi.'); return; }
    const res = await renewListing(id);
    if (!res.ok) { showToast('❌ Süre uzatılamadı.'); return; }
    showToast('✅ İlan süresi 90 gün uzatıldı.');
    await loadListings();
    // Not: ilan uzatma anahtar düşümü ileride RPC'ye bağlanacak
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
    { key: 'talepler', label: `📥 Gelen Talepler (${matchedReqs.length})` },
    { key: 'firsat',   label: `🔥 Fırsat Köşesi`, badge: unreadUrgentCount },
    { key: 'misafir',  label: `👥 Misafir (${guests.length})` },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7FA' }}>
        <p className="text-sm" style={{ color: '#6B7280' }}>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{
            background: toast.startsWith('❌') ? '#FEE2E2' : toast.startsWith('🔥') ? '#FFFBEB' : toast.startsWith('ℹ️') ? '#DBEAFE' : '#D1FAE5',
            color:      toast.startsWith('❌') ? '#991B1B' : toast.startsWith('🔥') ? '#92400E' : toast.startsWith('ℹ️') ? '#1E40AF' : '#065F46',
            border:     toast.startsWith('❌') ? '1px solid #FECACA' : toast.startsWith('🔥') ? '1px solid #FDE68A' : toast.startsWith('ℹ️') ? '1px solid #BFDBFE' : '1px solid #A7F3D0',
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
          <button onClick={() => setShowCoinModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition hover:opacity-80"
            style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.25)' }}>
            🗝️ {coinBalance} Anahtar
          </button>

          {unreadUrgentCount > 0 && (
            <button
              onClick={() => setActiveTab('firsat')}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition hover:opacity-80"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              🔥 Fırsat Köşesi
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={{ background: '#F59E0B', color: '#fff' }}>
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

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Çıkış
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Toplam İlan',  value: visibleListings.length,                               color: '#2F80ED', bg: '#EFF6FF' },
            { label: 'Aktif İlan',   value: visibleListings.filter(l=>l.status==='Aktif').length, color: '#10B981', bg: '#F0FDF4' },
            { label: 'Gelen Talep',  value: matchedReqs.length,                                    color: '#8B5CF6', bg: '#F5F3FF' },
            { label: 'Acil Talep',   value: urgentRequests.length,                                 color: '#F59E0B', bg: '#FFFBEB' },
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
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-extrabold"
                  style={{ background: '#F59E0B', color: '#fff' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── İlanlar Grid ── */}
        {activeTab === 'ilanlar' && (
          loadingListings ? (
            <div className="text-center py-20" style={{ color: '#9CA3AF' }}>
              <p className="text-sm">İlanlar yükleniyor...</p>
            </div>
          ) : visibleListings.length === 0 ? (
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
                  matchCount={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRenew={handleRenew}
                  onViewMatches={() => setActiveTab('talepler')}
                />
              ))}
            </div>
          )
        )}

        {/* ── Gelen Talepler (eşleşen, sansürlü + açma) ── */}
        {activeTab === 'talepler' && (
          <div>
            <div className="rounded-2xl p-5 mb-6"
              style={{ background: 'linear-gradient(135deg,#0D1B2A,#1a3a5c)', boxShadow: '0 4px 20px rgba(13,27,42,0.15)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📥</span>
                    <h2 className="text-lg font-extrabold text-white">Gelen Talepler</h2>
                  </div>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    İlanlarınızla eşleşen müşteri talepleri. İletişim bilgileri 50 anahtar ile açılır.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
                  🗝️ {coinBalance} Anahtar
                </div>
              </div>
            </div>

            {loadingMatched ? (
              <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
                <p className="text-sm">Talepler yükleniyor...</p>
              </div>
            ) : matchedReqs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📥</p>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>
                  İlanlarınızla eşleşen talep bulunmuyor.
                </p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  Yeni ilan ekledikçe ve müşteriler talep oluşturdukça burada görünecek.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {matchedReqs.map(req => {
                  const key = `${req.request_id}-${req.listing_id}`;
                  const opened = unlockedMatched[key];
                  const isOpen = !!opened;
                  const isUnlocking = unlockingId === key;
                  return (
                    <div key={req.match_id}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: '#fff',
                        border: isOpen ? '1.5px solid #86EFAC' : '1.5px solid #C4B5FD',
                        boxShadow: isOpen ? '0 4px 16px rgba(16,185,129,0.1)' : '0 4px 16px rgba(139,92,246,0.1)' }}>
                      {/* Üst şerit */}
                      <div className="flex items-center justify-between px-4 py-2.5"
                        style={{ background: isOpen ? '#F0FDF4' : '#F5F3FF' }}>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: '#8B5CF6', color: '#fff' }}>
                          🎯 {req.match_score}/8 kriter
                        </span>
                        {isOpen && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: '#D1FAE5', color: '#059669' }}>
                            ✅ Açıldı
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        {/* Kişi */}
                        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
                          style={{ background: isOpen ? '#F0FDF4' : '#F9FAFB', border: '1px solid #E5E7EB' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: isOpen ? '#10B981' : '#E5E7EB', color: isOpen ? '#fff' : '#9CA3AF' }}>
                            {isOpen
                              ? `${(opened.first_name||'').charAt(0)}${(opened.last_name||'').charAt(0)}`
                              : '🔒'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: '#0D1B2A' }}>
                              {isOpen ? `${opened.first_name} ${opened.last_name}` : req.masked_name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: isOpen ? '#2F80ED' : '#9CA3AF' }}>
                              📞 {isOpen ? opened.phone : req.masked_phone}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs mb-3 font-medium" style={{ color: '#8B5CF6' }}>
                          🏠 Eşleşen ilanınız: {req.listing_title}
                        </p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-4">
                          {[
                            { label: 'Mahalle',   value: `📍 ${req.neighborhood || '—'}` },
                            { label: 'Oda',       value: `🛏 ${req.rooms || '—'}` },
                            { label: 'Min Bütçe', value: fmtMoney(req.min_budget) },
                            { label: 'Max Bütçe', value: fmtMoney(req.max_budget) },
                          ].map(item => (
                            <div key={item.label}>
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
                              <p className="text-xs font-semibold" style={{ color: '#374151' }}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs mb-4 pb-3"
                          style={{ color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>
                          📅 {req.created_at ? new Date(req.created_at).toLocaleDateString('tr-TR') : '—'}
                        </p>

                        {!isOpen ? (
                          <button
                            onClick={() => handleUnlockMatched(req)}
                            disabled={isUnlocking}
                            className="w-full py-3 rounded-xl text-white text-sm font-bold transition hover:opacity-90 active:scale-95"
                            style={{
                              background: isUnlocking ? '#94a3b8'
                                : coinBalance >= 50 ? 'linear-gradient(90deg,#8B5CF6,#7C3AED)' : '#D1D5DB',
                              boxShadow: !isUnlocking && coinBalance >= 50 ? '0 3px 12px rgba(139,92,246,0.3)' : 'none',
                              cursor: isUnlocking ? 'not-allowed' : coinBalance >= 50 ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isUnlocking ? 'Açılıyor...' : '🗝️ 50 Anahtar ile İletişim Bilgilerini Aç'}
                          </button>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                            style={{ background: '#D1FAE5', color: '#059669' }}>
                            ✅ İletişim bilgileri açıldı
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Fırsat Köşesi ── */}
        {activeTab === 'firsat' && (
          <div>
            <div className="rounded-2xl p-5 mb-6"
              style={{ background: 'linear-gradient(135deg,#0D1B2A,#1a3a5c)', boxShadow: '0 4px 20px rgba(13,27,42,0.15)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <h2 className="text-lg font-extrabold text-white">Fırsat Köşesi</h2>
                    {unreadUrgentCount > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: '#F59E0B', color: '#fff' }}>
                        {unreadUrgentCount} yeni
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    Acil öncelikli müşteri taleplerini burada görüntüleyebilirsiniz.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
                  🗝️ {coinBalance} Anahtar
                </div>
              </div>
            </div>

            {urgentRequests.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
                <p className="text-4xl mb-3">🔥</p>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>Henüz acil talep bulunmuyor.</p>
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
          onUnlock={() => {}}
          unlockedContacts={unlockedContacts}
        />
      )}
    </div>
  );
}