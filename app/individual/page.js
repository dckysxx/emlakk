'use client';
import { useState } from 'react';
import RequestModal from '../components/RequestModal';
import ProfileModal from '../components/ProfileModal';
import ListingCard from '../components/ListingCard';
import RequestAndFilterHero from '../components/RequestAndFilterHero';

const MOCK_LISTINGS = [
  { id: 1, title: 'Çorlu Merkezde 3+1 Daire', price: '2.800.000 ₺', rooms: '3+1', type: 'Satılık', location: 'Çorlu', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80' },
  { id: 2, title: 'Tekirdağ Deniz Manzaralı 2+1', price: '8.500 ₺/ay', rooms: '2+1', type: 'Kiralık', location: 'Tekirdağ', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80' },
  { id: 3, title: 'Çorlu Sanayi Yakını 1+1', price: '5.200 ₺/ay', rooms: '1+1', type: 'Kiralık', location: 'Çorlu', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80' },
  { id: 4, title: 'Tekirdağ 4+1 Müstakil Villa', price: '6.200.000 ₺', rooms: '4+1', type: 'Satılık', location: 'Tekirdağ', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80' },
  { id: 5, title: 'Çorlu Yeni Binada 2+1', price: '3.100.000 ₺', rooms: '2+1', type: 'Satılık', location: 'Çorlu', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80' },
  { id: 6, title: 'Tekirdağ Merkez Kiralık Ofis', price: '12.000 ₺/ay', rooms: '3+1', type: 'Kiralık', location: 'Tekirdağ', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' },
];

export default function IndividualDashboard() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filters, setFilters] = useState({ type: 'Tümü', location: 'Tümü', rooms: 'Tümü' });
  const [favorites, setFavorites] = useState([]);

  const filtered = MOCK_LISTINGS.filter(l => {
    if (filters.type !== 'Tümü' && l.type !== filters.type) return false;
    if (filters.location !== 'Tümü' && l.location !== filters.location) return false;
    if (filters.rooms !== 'Tümü' && l.rooms !== filters.rooms) return false;
    return true;
  });

  const toggleFavorite = (id) =>
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>

      {/* ── Navbar ── */}
      <nav
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-40"
        style={{
          background: '#0D1B2A',
          boxShadow: '0 2px 16px rgba(13,27,42,0.25)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">Ev Sor </span>
            <span style={{ color: '#2F80ED' }}>Bulsun</span>
          </span>
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-medium ml-1"
            style={{ background: 'rgba(47,128,237,0.15)', color: '#7ec8ff' }}
          >
            Bireysel
          </span>
        </div>

        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#2F80ED', color: '#fff' }}
          >
            AY
          </div>
          <span className="text-white text-sm font-medium hidden sm:block">Ali Yılmaz</span>
        </button>
      </nav>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero: Özel Talep + Filtre */}
        <RequestAndFilterHero
          onOpenRequest={() => setShowRequestModal(true)}
          filters={filters}
          setFilters={setFilters}
        />

        {/* ── Listings Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#0D1B2A' }}>
              Öne Çıkan İlanlar
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              Tekirdağ &amp; Çorlu bölgesindeki güncel ilanlar
            </p>
          </div>
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #dbeafe' }}
          >
            {filtered.length} ilan
          </span>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorite={favorites.includes(listing.id)}
              onToggleFavorite={() => toggleFavorite(listing.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold" style={{ color: '#374151' }}>
              Bu kriterlere uygun ilan bulunamadı
            </p>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              Filtreleri değiştirmeyi deneyin
            </p>
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          favorites={MOCK_LISTINGS.filter(l => favorites.includes(l.id))}
        />
      )}
    </div>
  );
}