'use client';
import { useState, useEffect } from 'react';
import {
  getDaysRemaining,
  getExpiryStatus,
  formatDate,
} from '../utils/expiry';
import { fetchMyProfile, updateMyProfile } from '../../lib/profileService';
import { fetchMyRequestsWithMatches, deleteRequest } from '../../lib/requests';
import { fetchMyFavoriteListings, removeFavorite } from '../../lib/favoriteService';

const STATUS_STYLE = {
  'Beklemede':   { bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
  'İnceleniyor': { bg: '#DBEAFE', color: '#2563EB', dot: '#3B82F6' },
  'Tamamlandı':  { bg: '#D1FAE5', color: '#059669', dot: '#10B981' },
};

// ─── DB request → UI ──────────────────────────────────────────────────────────
function dbToUiRequest(row) {
  const fmtMoney = (v) => (v != null ? Number(v).toLocaleString('tr-TR') + ' ₺' : '—');
  return {
    id:           row.id,
    listingType:  row.listing_type,
    neighborhood: row.neighborhood || '—',
    rooms:        row.rooms || '—',
    minBudget:    fmtMoney(row.min_budget),
    maxBudget:    fmtMoney(row.max_budget),
    isUrgent:     row.is_urgent,
    matchCount:   row.match_count || 0,
    status:       'Beklemede',
    expiresAt:    row.expires_at,
    createdAt:    row.created_at,
  };
}

// ─── DB listing → favori kartı UI ─────────────────────────────────────────────
function dbToUiFavorite(row) {
  const n = Number(row.price);
  const price = n
    ? (row.listing_type === 'Kiralık'
        ? `${n.toLocaleString('tr-TR')} ₺/ay`
        : `${n.toLocaleString('tr-TR')} ₺`)
    : `${row.price} ₺`;
  return {
    id:           row.id,
    title:        row.title,
    price,
    rooms:        row.rooms,
    sqm:          row.net_m2,
    neighborhood: row.neighborhood,
    type:         row.listing_type,
    imageUrl:     '',
  };
}

// ─── Alt componentler — DIŞARIDA tanımlı ──────────────────────────────────────

function FavoriteListingRow({ listing, onRemove }) {
  return (
    <div
      className="flex rounded-2xl overflow-hidden transition-all duration-150"
      style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', minHeight: '110px' }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,27,42,0.1)';
        e.currentTarget.style.border = '1px solid #BFDBFE';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.border = '1px solid #E5E7EB';
      }}
    >
      <div className="flex-shrink-0 overflow-hidden" style={{ width: '160px', minHeight: '110px', background: '#E2E8F0' }}>
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-3xl">🏠</span></div>
        )}
      </div>
      <div className="flex-1 flex items-center justify-between px-4 py-3 min-w-0">
        <div className="flex-1 min-w-0 pr-3">
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5"
            style={listing.type === 'Satılık' ? { background: '#EFF6FF', color: '#2F80ED' } : { background: '#ECFDF5', color: '#10B981' }}>
            {listing.type}
          </span>
          <p className="font-bold text-sm leading-snug mb-1"
            style={{ color: '#0D1B2A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {listing.title}
          </p>
          <p className="font-extrabold text-base mb-1.5" style={{ color: '#2F80ED' }}>{listing.price}</p>
          <div className="flex items-center gap-3 flex-wrap" style={{ color: '#6B7280' }}>
            {listing.rooms && <span className="text-xs">🛏 {listing.rooms}</span>}
            {listing.sqm && <span className="text-xs">📐 {listing.sqm} m²</span>}
            {listing.neighborhood && <span className="text-xs">📍 {listing.neighborhood}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={() => onRemove(listing.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:bg-red-50"
            style={{ color: '#EF4444', border: '1px solid #FECACA' }}>
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
    if (window.confirm('Bu talebi silmek istediğinize emin misiniz?')) onDelete(request.id);
  };

  return (
    <div className="rounded-2xl p-4"
      style={{ background: '#F9FAFB',
        border: `1px solid ${expiryState === 'expired' ? '#FECACA' : expiryState === 'expiring_soon' ? '#FDE68A' : '#D1FAE5'}` }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={request.listingType === 'Satılık' ? { background: '#EFF6FF', color: '#2F80ED' } : { background: '#ECFDF5', color: '#10B981' }}>
            {request.listingType === 'Satılık' ? '🏠' : '🔑'} {request.listingType}
          </span>
          {request.isUrgent && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#F59E0B', color: '#fff' }}>
              🔥 Acil Talep
            </span>
          )}
          {request.matchCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#D1FAE5', color: '#059669' }}>
              🎯 Eşleşme Var ({request.matchCount})
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background: statusStyle.bg, color: statusStyle.color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: statusStyle.dot }} />
            {request.status}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: expiryBadge.bg, color: expiryBadge.color }}>
            {expiryBadge.text}
          </span>
        </div>
        <button onClick={handleDelete}
          className="text-xs px-2.5 py-1 rounded-lg transition"
          style={{ color: '#EF4444', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.border = '1px solid #FECACA'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}>
          🗑 Sil
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mb-3">
        {[
          { label: 'Mahalle',   value: `📍 ${request.neighborhood}` },
          { label: 'Oda',       value: `🛏 ${request.rooms}` },
          { label: 'Min Bütçe', value: request.minBudget },
          { label: 'Max Bütçe', value: request.maxBudget },
        ].map(item => (
          <div key={item.label}>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
            <p className="text-xs font-semibold" style={{ color: '#374151' }}>{item.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs pt-2.5" style={{ color: '#9CA3AF', borderTop: '1px solid #E5E7EB' }}>
        📅 Bitiş: {formatDate(request.expiresAt)}
        {expiryState === 'expiring_soon' && (
          <span className="ml-2 font-medium" style={{ color: '#D97706' }}>· ⏰ Talebinizin süresi yakında dolacak.</span>
        )}
      </p>
    </div>
  );
}

// ─── Ana Modal ────────────────────────────────────────────────────────────────
export default function ProfileModal({ onClose, corporate = false, onLogout, onFavoritesChanged }) {
  const [activeTab, setActiveTab] = useState('favoriler');
  const [deleteMsg, setDeleteMsg] = useState(false);

  // ── Favoriler (gerçek) ─────────────────────────────────────────────────────
  const [favList,    setFavList]    = useState([]);
  const [loadingFav, setLoadingFav] = useState(true);

  // ── Talepler (gerçek + eşleşme) ────────────────────────────────────────────
  const [requests,    setRequests]    = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  // ── Profil (gerçek) ─────────────────────────────────────────────────────────
  const [profile,      setProfile]      = useState(null);
  const [loadingProf,  setLoadingProf]  = useState(true);
  const [editMode,     setEditMode]     = useState(false);
  const [savingProf,   setSavingProf]   = useState(false);
  const [profMsg,      setProfMsg]      = useState('');
  const [editForm,     setEditForm]     = useState({ firstName: '', lastName: '', phone: '' });

  // Profil çek
  useEffect(() => {
    let mounted = true;
    fetchMyProfile().then(res => {
      if (!mounted) return;
      if (res.ok) {
        setProfile(res.data);
        setEditForm({
          firstName: res.data.first_name || '',
          lastName:  res.data.last_name  || '',
          phone:     res.data.phone      || '',
        });
      }
      setLoadingProf(false);
    });
    return () => { mounted = false; };
  }, []);

  // Favori + talep çek (bireysel)
  useEffect(() => {
    if (corporate) { setLoadingFav(false); setLoadingReqs(false); return; }
    let mounted = true;

    fetchMyFavoriteListings().then(res => {
      if (!mounted) return;
      if (res.ok) setFavList(res.data.map(dbToUiFavorite));
      setLoadingFav(false);
    });

    fetchMyRequestsWithMatches().then(res => {
      if (!mounted) return;
      if (res.ok) setRequests(res.data.map(dbToUiRequest));
      setLoadingReqs(false);
    });

    return () => { mounted = false; };
  }, [corporate]);

  const handleDeleteRequest = async (id) => {
    const res = await deleteRequest(id);
    if (!res.ok) { setProfMsg('error:Talep silinirken bir hata oluştu.'); setTimeout(() => setProfMsg(''), 2500); return; }
    setRequests(prev => prev.filter(r => r.id !== id));
    setDeleteMsg(true);
    setTimeout(() => setDeleteMsg(false), 2500);
  };

  const handleRemoveFavorite = async (id) => {
    const res = await removeFavorite(id);
    if (!res.ok) { setProfMsg('error:Favori kaldırılırken bir hata oluştu.'); setTimeout(() => setProfMsg(''), 2500); return; }
    setFavList(prev => prev.filter(f => f.id !== id));
    if (typeof onFavoritesChanged === 'function') onFavoritesChanged();
  };

  const startEdit = () => {
    setProfMsg('');
    setEditForm({
      firstName: profile?.first_name || '',
      lastName:  profile?.last_name  || '',
      phone:     profile?.phone      || '',
    });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setProfMsg('error:Ad ve soyad zorunludur.');
      return;
    }
    setSavingProf(true);
    setProfMsg('');
    const res = await updateMyProfile(editForm);
    setSavingProf(false);
    if (!res.ok) { setProfMsg('error:Profil güncellenirken bir hata oluştu.'); return; }
    setProfile(res.data);
    setEditMode(false);
    setProfMsg('success:Profil bilgileriniz güncellendi.');
    setTimeout(() => setProfMsg(''), 2500);
  };

  const displayName  = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Kullanıcı'
    : (loadingProf ? '...' : 'Kullanıcı');
  const displayEmail = profile?.email || '';
  const displayPhone = profile?.phone || '';
  const initials = profile
    ? `${(profile.first_name || '').charAt(0)}${(profile.last_name || '').charAt(0)}`.toUpperCase() || '👤'
    : '👤';

  const inputStyle = {
    width: '100%', borderRadius: '10px', padding: '8px 10px', fontSize: '12px',
    outline: 'none', background: '#fff', color: '#0D1B2A', border: '1.5px solid #E5E7EB',
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
          maxWidth: '960px', maxHeight: '88vh',
          background: '#fff', borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.28)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4 flex-shrink-0" style={{ background: '#0D1B2A' }}>
          <h2 className="text-base font-bold text-white">👤 Profilim</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}>×</button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">

          {/* Sol Panel */}
          <div className="flex flex-col flex-shrink-0 p-6 gap-5"
            style={{ width: '240px', minWidth: '240px', background: '#F9FAFB', borderRight: '1px solid #E5E7EB' }}>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-extrabold"
                style={{ background: corporate ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#2F80ED,#1a6fd4)' }}>
                {initials}
              </div>

              {!editMode ? (
                <>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#0D1B2A' }}>{displayName}</p>
                    {displayEmail && <p className="text-xs mt-0.5 break-all" style={{ color: '#6B7280' }}>{displayEmail}</p>}
                    {displayPhone && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{displayPhone}</p>}
                  </div>
                  <button onClick={startEdit} disabled={loadingProf}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
                    style={{ background: '#EFF6FF', color: '#2F80ED', border: '1px solid #BFDBFE',
                      opacity: loadingProf ? 0.5 : 1, cursor: loadingProf ? 'not-allowed' : 'pointer' }}>
                    ✏️ Düzenle
                  </button>
                </>
              ) : (
                <div className="w-full flex flex-col gap-2 text-left">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>Ad</label>
                    <input value={editForm.firstName}
                      onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                      style={inputStyle} placeholder="Ad" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>Soyad</label>
                    <input value={editForm.lastName}
                      onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                      style={inputStyle} placeholder="Soyad" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>Telefon</label>
                    <input value={editForm.phone}
                      onChange={e => setEditForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                      style={inputStyle} placeholder="05XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>E-posta</label>
                    <input value={displayEmail} disabled
                      style={{ ...inputStyle, background: '#F1F5F9', color: '#9CA3AF', cursor: 'not-allowed' }} />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => { setEditMode(false); setProfMsg(''); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition hover:bg-gray-100"
                      style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: '#fff' }}>
                      İptal
                    </button>
                    <button onClick={handleSaveProfile} disabled={savingProf}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90"
                      style={{ background: savingProf ? '#94a3b8' : 'linear-gradient(90deg,#2F80ED,#1a6fd4)',
                        cursor: savingProf ? 'not-allowed' : 'pointer' }}>
                      {savingProf ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              )}

              {profMsg && (
                <div className="w-full px-3 py-2 rounded-lg text-xs font-semibold"
                  style={profMsg.startsWith('success')
                    ? { background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }
                    : { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
                  {profMsg.startsWith('success') ? '✅ ' : '⚠️ '}{profMsg.split(':')[1]}
                </div>
              )}
            </div>

            {!corporate && !editMode && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>❤️ Favoriler</span>
                  <span className="text-xs font-bold" style={{ color: '#2F80ED' }}>{favList.length}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>📋 Talepler</span>
                  <span className="text-xs font-bold" style={{ color: '#10B981' }}>{requests.length}</span>
                </div>
              </div>
            )}

            <div className="flex-1" />

            <button onClick={() => { if (typeof onLogout === 'function') onLogout(); else onClose(); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:bg-red-50"
              style={{ border: '1px solid #FECACA', color: '#EF4444' }}>
              Çıkış Yap
            </button>
          </div>

          {/* Sağ Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {!corporate && (
              <div className="flex gap-1 px-5 py-3 flex-shrink-0"
                style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
                {[
                  { key: 'favoriler', label: `❤️ Favorilerim (${favList.length})` },
                  { key: 'talepler',  label: `📋 Taleplerim (${requests.length})` },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={activeTab === tab.key ? { background: '#0D1B2A', color: '#fff' } : { color: '#6B7280', background: 'transparent' }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {deleteMsg && (
              <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 flex items-center gap-2"
                style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                ✅ Talebiniz silindi.
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">

              {!corporate && activeTab === 'favoriler' && (
                <div className="flex flex-col gap-3">
                  {loadingFav ? (
                    <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
                      <p className="text-sm">Favoriler yükleniyor...</p>
                    </div>
                  ) : favList.length > 0 ? (
                    favList.map(fav => (
                      <FavoriteListingRow key={fav.id} listing={fav} onRemove={handleRemoveFavorite} />
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">🤍</p>
                      <p className="font-semibold" style={{ color: '#374151' }}>Henüz favori ilanınız bulunmuyor.</p>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        İlan kartlarındaki ❤️ ikonuna tıklayarak favorilere ekleyebilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!corporate && activeTab === 'talepler' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 rounded-full" style={{ background: '#10B981' }} />
                    <h3 className="text-sm font-bold" style={{ color: '#10B981' }}>Taleplerim</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: '#D1FAE5', color: '#059669' }}>
                      {requests.length} talep
                    </span>
                  </div>

                  {loadingReqs ? (
                    <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
                      <p className="text-sm">Talepler yükleniyor...</p>
                    </div>
                  ) : requests.length > 0 ? (
                    requests.map(req => (
                      <UserRequestRow key={req.id} request={req} onDelete={handleDeleteRequest} />
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-3xl mb-2">📋</p>
                      <p className="font-semibold" style={{ color: '#374151' }}>Henüz özel talebiniz bulunmuyor.</p>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        Ana sayfadaki "Özel Talep Formu Oluştur" butonunu kullanabilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              )}

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