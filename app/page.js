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
import { createRequest } from '../lib/requests';

const MOCK_LISTINGS = [
  {
    id: 1, title: 'Çorlu Reşadiye 3+1 Satılık Daire',
    price: '2800000', rooms: '3+1', type: 'Satılık',
    location: 'Çorlu', neighborhood: 'Reşadiye',
    sqm: 120, buildingAge: 8,
    features: ['Balkon','Asansör','Otopark'],
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  },
  {
    id: 2, title: 'Tekirdağ Hürriyet 2+1 Kiralık',
    price: '8500', rooms: '2+1', type: 'Kiralık',
    location: 'Tekirdağ', neighborhood: 'Hürriyet',
    sqm: 85, buildingAge: 12,
    features: ['Balkon','Eşyalı'],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
  },
  {
    id: 3, title: 'Çorlu Kazımiye 1+1 Kiralık',
    price: '5200', rooms: '1+1', type: 'Kiralık',
    location: 'Çorlu', neighborhood: 'Kazımiye',
    sqm: 55, buildingAge: 3,
    features: ['Asansör'],
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
  },
  {
    id: 4, title: 'Tekirdağ Cemaliye 4+1 Müstakil',
    price: '6200000', rooms: '4+1', type: 'Satılık',
    location: 'Tekirdağ', neighborhood: 'Cemaliye',
    sqm: 220, buildingAge: 2,
    features: ['Balkon','Otopark','Güvenlik','Havuz','Site içinde'],
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80',
  },
  {
    id: 5, title: 'Çorlu Muhittin 2+1 Satılık',
    price: '3100000', rooms: '2+1', type: 'Satılık',
    location: 'Çorlu', neighborhood: 'Muhittin',
    sqm: 95, buildingAge: 15,
    features: ['Balkon'],
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80',
  },
  {
    id: 6, title: 'Tekirdağ Nusratiye 3+1 Kiralık',
    price: '12000', rooms: '3+1', type: 'Kiralık',
    location: 'Tekirdağ', neighborhood: 'Nusratiye',
    sqm: 130, buildingAge: 6,
    features: ['Asansör','Eşyalı','Site içinde'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
  },
];

function formatListingPrice(listing) {
  const n = Number(listing.price);
  if (!n) return `${listing.price} ₺`;
  return listing.type === 'Kiralık'
    ? `${n.toLocaleString('tr-TR')} ₺/ay`
    : `${n.toLocaleString('tr-TR')} ₺`;
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

  // ── Gerçek auth state ──────────────────────────────────────────────────────
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

  // ── Filtre & favori ─────────────────────────────────────────────────────────
  const [filters, setFilters]     = useState(EMPTY_FILTERS);
  const [favorites, setFavorites] = useState([]);

  // ── Uyarı ─────────────────────────────────────────────────────────────────
  const [warning, setWarning] = useState('');
  const showWarning = (msg) => {
    setWarning(msg);
    setTimeout(() => setWarning(''), 3500);
  };

  // ── Session restore ─────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    getCurrentUser().then(({ user, userType }) => {
      if (!mounted) return;
      if (user) {
        setUser(user);
        setUserType(userType);
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
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
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

  // ── Talep kaydet (gerçek database) ────────────────────────────────────────
  const handleSubmitRequest = async (formPayload) => {
    if (!user) return { ok: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };
    const res = await createRequest(formPayload, user.id);
    return res; // { ok: true/false, error? }
  };

  // ── Favori ───────────────────────────────────────────────────────────────────
  const toggleFavorite = (id) => {
    if (!user || isGuest) { setLoginMode('individual'); setShowLoginModal(true); return; }
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
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

  const displayListings = useMemo(() => filterListings(MOCK_LISTINGS, filters), [filters]);

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
              Bu kriterlere uygun ilan bulunamadı
            </p>
            <p className="text-sm mt-1 mb-4" style={{ color: '#9CA3AF' }}>
              Filtreleri değiştirmeyi deneyin
            </p>
            <button
              onClick={handleClearAll}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90"
              style={{ background: '#2F80ED', color: '#fff' }}
            >
              Filtreleri Temizle
            </button>
          </div>
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
          favorites={MOCK_LISTINGS.filter(l => favorites.includes(l.id))}
        />
      )}
    </div>
  );
}