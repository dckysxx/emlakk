'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RequestModal           from './components/RequestModal';
import ProfileModal           from './components/ProfileModal';
import ListingCard            from './components/ListingCard';
import LoginModal             from './components/LoginModal';
import RequestAndFilterHero   from './components/RequestAndFilterHero';
import ActiveFilterTags       from './components/ActiveFilterTags';
import { filterListings, EMPTY_FILTERS } from './utils/filterListings';
import { signInIndividual, signInCorporate, signOut, getCurrentUser, onAuthStateChange } from '../lib/auth';
import { createRequest, runMatchForRequest } from '../lib/requests';
import { fetchPublicListings } from '../lib/listings';
import { fetchMyFavoriteIds, addFavorite, removeFavorite } from '../lib/favoriteService';

function formatListingPrice(listing) {
  const n = Number(listing.price);
  if (!n) return `${listing.price} ₺`;
  return listing.type === 'Kiralık'
    ? `${n.toLocaleString('tr-TR')} ₺/ay`
    : `${n.toLocaleString('tr-TR')} ₺`;
}

// ─── DB ilan satırını UI formatına çevir ──────────────────────────────────────
function dbToUiListing(row) {
  return {
    id:           row.id,
    title:        row.title,
    type:         row.listing_type,
    price:        String(row.price ?? ''),
    location:     row.neighborhood || row.district || row.city || '',
    neighborhood: row.neighborhood,
    rooms:        row.rooms,
    sqm:          row.net_m2,
    buildingAge:  row.building_age,
    features:     [],
    image:        '',
  };
}

const CLEAR_DETAILED = {
  minPrice: '', maxPrice: '',
  minM2: '', maxM2: '',
  buildingAge: '',
  neighborhoods: [],
  features: [],
};

function getInitials(user) {
  const f = user?.user_metadata?.first_name || '';
  const l = user?.user_metadata?.last_name  || '';
  const init = `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  return init || '👤';
}
function getFullName(user) {
  const f = user?.user_metadata?.first_name || '';
  const l = user?.user_metadata?.last_name  || '';
  return `${f} ${l}`.trim() || user?.email || 'Kullanıcı';
}

export default function HomePage() {
  const router = useRouter();

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user,        setUser]        = useState(null);
  const [userType,    setUserType]    = useState(null);
  const [isGuest,     setIsGuest]     = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const isLoggedIn = !!user || isGuest;

  const [pendingAction, setPendingAction] = useState(null);
  const [loginMode,     setLoginMode]     = useState('individual');

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showLoginModal,   setShowLoginModal]   = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ── İlanlar (gerçek) ─────────────────────────────────────────────────────────
  const [listings,        setListings]        = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // ── Filtre & favori ─────────────────────────────────────────────────────────
  const [filters, setFilters]     = useState(EMPTY_FILTERS);
  const [favorites, setFavorites] = useState([]); // listing_id (UUID) dizisi

  // ── Uyarı ─────────────────────────────────────────────────────────────────
  const [warning, setWarning] = useState('');
  const showWarning = (msg) => {
    setWarning(msg);
    setTimeout(() => setWarning(''), 3500);
  };

  // ── Favori id'leri çek (yardımcı) ─────────────────────────────────────────────
  const loadFavorites = async () => {
    const res = await fetchMyFavoriteIds();
    if (res.ok) setFavorites(res.data);
  };

  // ── Session restore ─────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    getCurrentUser().then(({ user, userType }) => {
      if (!mounted) return;
      if (user) {
        setUser(user);
        setUserType(userType);
        if (userType !== 'corporate') loadFavorites();
      }
      setLoadingAuth(false);
    });

    const subscription = onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        setUserType(session.user.user_metadata?.user_type || null);
        setIsGuest(false);
      } else {
        setUser(null);
        setUserType(null);
        setFavorites([]);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ── İlanları çek ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetchPublicListings().then(res => {
      if (!mounted) return;
      if (res.ok) setListings(res.data.map(dbToUiListing));
      setLoadingListings(false);
    });
    return () => { mounted = false; };
  }, []);

  // ── Bireysel giriş ──────────────────────────────────────────────────────────
  const handleLoginIndividual = async (email, password) => {
    const res = await signInIndividual({ email, password });
    if (!res.ok) return res;

    const u = res.data.user;
    setUser(u);
    setUserType(u.user_metadata?.user_type || 'individual');
    setIsGuest(false);
    setShowLoginModal(false);
    loadFavorites();

    if (pendingAction === 'openRequestForm') {
      setShowRequestModal(true);
      setPendingAction(null);
    }
    return { ok: true };
  };

  // ── Kurumsal giriş ──────────────────────────────────────────────────────────
  const handleLoginCorporate = async (email, password) => {
    const res = await signInCorporate({ email, password });
    if (!res.ok) return res;

    setShowLoginModal(false);
    setPendingAction(null);
    router.push('/corporate');
    return { ok: true };
  };

  // ── Misafir ────────────────────────────────────────────────────────────────
  const handleGuestLogin = () => {
    setIsGuest(true);
    setUser(null);
    setUserType('individual');
    setShowLoginModal(false);
    setPendingAction(null);
  };

  // ── Çıkış ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
      setUserType(null);
      return;
    }
    await signOut();
    setUser(null);
    setUserType(null);
    setIsGuest(false);
    setPendingAction(null);
    setFavorites([]);
  };

  const handleCloseLogin = () => { setShowLoginModal(false); setPendingAction(null); };

  const openIndividualLogin = () => { setLoginMode('individual'); setShowLoginModal(true); };
  const openCorporateLogin  = () => { setLoginMode('corporate');  setShowLoginModal(true); };

  // ── Özel Talep erişim kontrolü ─────────────────────────────────────────────
  const handleOpenRequest = () => {
    if (!user && !isGuest) {
      setPendingAction('openRequestForm');
      setLoginMode('individual');
      setShowLoginModal(true);
      return;
    }
    if (isGuest) {
      showWarning('Özel talep formu sadece bireysel üyelere özeldir. Lütfen üye girişi yapın.');
      setPendingAction('openRequestForm');
      setLoginMode('individual');
      setShowLoginModal(true);
      return;
    }
    if (userType === 'corporate') {
      showWarning('Özel talep formu sadece bireysel kullanıcılar içindir.');
      return;
    }
    setShowRequestModal(true);
  };

  // ── Talep kaydet + eşleşme hesapla ────────────────────────────────────────
  const handleSubmitRequest = async (formPayload) => {
    if (!user) return { ok: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
    const res = await createRequest(formPayload, user.id);
    if (!res.ok) return res;

    // Talep oluştu → güvenli RPC ile eşleşmeleri hesapla
    let matchCount = 0;
    const matchRes = await runMatchForRequest(res.data.id);
    if (matchRes.ok) matchCount = matchRes.created;

    return { ok: true, matchCount };
  };

  // ── Favori toggle (gerçek DB) ─────────────────────────────────────────────────
  const toggleFavorite = async (id) => {
    if (!user || isGuest) { setLoginMode('individual'); setShowLoginModal(true); return; }

    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);

    const res = isFav ? await removeFavorite(id) : await addFavorite(id);
    if (!res.ok) {
      setFavorites(prev => isFav ? [...prev, id] : prev.filter(f => f !== id));
      showWarning('Favori işlemi sırasında bir hata oluştu.');
    }
  };

  // ── Filtre ────────────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleRemoveTag = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      if (Array.isArray(current)) return { ...prev, [key]: current.filter(v => v !== value) };
      return { ...prev, [key]: '' };
    });
  };
  const handleClearAll      = () => setFilters(EMPTY_FILTERS);
  const handleClearDetailed = () => setFilters(prev => ({ ...prev, ...CLEAR_DETAILED }));

  const displayListings = useMemo(() => filterListings(listings, filters), [listings, filters]);

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>

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
            className="text-xs px-2.5 py-0.5 rounded-full font-medium hidden sm:inline"
            style={{ background: 'rgba(47,128,237,0.15)', color: '#7ec8ff' }}
          >
            Tekirdağ &amp; Çorlu
          </span>
        </div>

        <div className="flex items-center gap-2">
          {loadingAuth ? null : !isLoggedIn ? (
            <>
              <button
                onClick={openIndividualLogin}
                className="hidden sm:block px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)', boxShadow: '0 2px 10px rgba(47,128,237,0.3)' }}
              >
                Kullanıcı Girişi
              </button>
              <button
                onClick={openCorporateLogin}
                className="hidden sm:block px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(90deg,#10B981,#059669)', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}
              >
                Kurumsal Giriş
              </button>
              <button
                onClick={openIndividualLogin}
                className="sm:hidden px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)' }}
              >
                Giriş Yap
              </button>
            </>
          ) : (
            <>
              {isGuest && (
                <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                  👤 Misafir
                </span>
              )}
              {!isGuest && user && (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#2F80ED', color: '#fff' }}>
                    {getInitials(user)}
                  </div>
                  <span className="text-white text-sm font-medium hidden sm:block">
                    {getFullName(user)}
                  </span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Çıkış
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {warning && (
          <div className="mb-5 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"
            style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
            ⚠️ {warning}
          </div>
        )}

        <RequestAndFilterHero
          onOpenRequest={handleOpenRequest}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearDetailed={handleClearDetailed}
        />

        <ActiveFilterTags
          filters={filters}
          onRemove={handleRemoveTag}
          onClearAll={handleClearAll}
        />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#0D1B2A' }}>Öne Çıkan İlanlar</h3>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              Tekirdağ &amp; Çorlu bölgesindeki güncel ilanlar
            </p>
          </div>
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #dbeafe' }}
          >
            {displayListings.length} ilan
          </span>
        </div>

        {loadingListings ? (
          <div className="text-center py-20" style={{ color: '#9CA3AF' }}>
            <p className="text-sm">İlanlar yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={{ ...listing, price: formatListingPrice(listing) }}
                  isFavorite={favorites.includes(listing.id)}
                  onToggleFavorite={() => toggleFavorite(listing.id)}
                />
              ))}
            </div>

            {displayListings.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold" style={{ color: '#374151' }}>
                  {listings.length === 0 ? 'Henüz ilan bulunmuyor' : 'Bu kriterlere uygun ilan bulunamadı'}
                </p>
                <p className="text-sm mt-1 mb-4" style={{ color: '#9CA3AF' }}>
                  {listings.length === 0 ? 'Kurumsal kullanıcılar ilan ekledikçe burada görünecek.' : 'Filtreleri değiştirmeyi deneyin'}
                </p>
                {listings.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90"
                    style={{ background: '#2F80ED', color: '#fff' }}
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showLoginModal && (
        <LoginModal
          onClose={handleCloseLogin}
          onLoginIndividual={handleLoginIndividual}
          onLoginCorporate={handleLoginCorporate}
          onGuestLogin={handleGuestLogin}
          initialMode={loginMode}
        />
      )}
      {showRequestModal && (
        <RequestModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleSubmitRequest}
        />
      )}
      {showProfileModal && user && !isGuest && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          onFavoritesChanged={loadFavorites}
        />
      )}
    </div>
  );
}