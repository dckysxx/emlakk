'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import CorporateApplicationModal from './CorporateApplicationModal';

function isValidTurkishPhone(phone) {
  return /^05\d{9}$/.test(phone.replace(/\s/g, ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginModal({
  onClose,
  onLoginIndividual,
  onLoginCorporate,
  onGuestLogin,
}) {
  const [tab,              setTab]              = useState('bireysel');
  const [authView,         setAuthView]         = useState('login');
  const [showPw,           setShowPw]           = useState(false);
  const [showPw2,          setShowPw2]          = useState(false);
  const [registerSuccess,  setRegisterSuccess]  = useState(false);
  const [showAppModal,     setShowAppModal]     = useState(false);

  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg,   setReg]   = useState({
    firstName: '', lastName: '', phone: '',
    email: '', password: '', password2: '',
  });
  const [regErrors, setRegErrors] = useState({});

  const updateLogin = (k, v) => setLogin(p => ({ ...p, [k]: v }));
  const updateReg   = (k, v) => {
    setReg(p => ({ ...p, [k]: v }));
    if (regErrors[k]) setRegErrors(p => ({ ...p, [k]: '' }));
  };

  const validateReg = () => {
    const e = {};
    if (!reg.firstName.trim())         e.firstName = 'Ad zorunludur.';
    if (!reg.lastName.trim())          e.lastName  = 'Soyad zorunludur.';
    if (!reg.phone.trim())             e.phone     = 'Telefon zorunludur.';
    else if (!isValidTurkishPhone(reg.phone))
                                       e.phone     = 'Geçerli bir Türkiye numarası girin (05XXXXXXXXX).';
    if (!reg.email.trim())             e.email     = 'E-posta zorunludur.';
    else if (!isValidEmail(reg.email)) e.email     = 'Geçerli bir e-posta girin.';
    if (!reg.password)                 e.password  = 'Şifre zorunludur.';
    if (!reg.password2)                e.password2 = 'Şifre tekrar zorunludur.';
    else if (reg.password !== reg.password2)
                                       e.password2 = 'Şifreler eşleşmiyor.';
    return e;
  };

  const handleRegister = () => {
    const e = validateReg();
    if (Object.keys(e).length > 0) { setRegErrors(e); return; }
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setAuthView('login');
      setReg({ firstName:'', lastName:'', phone:'', email:'', password:'', password2:'' });
    }, 2500);
  };

  const inputStyle = (hasError) => ({
    width: '100%', borderRadius: '12px',
    padding: '10px 14px', fontSize: '13px',
    outline: 'none', transition: 'border 0.15s',
    background: '#F9FAFB', color: '#0D1B2A',
    border: `1.5px solid ${hasError ? '#FCA5A5' : '#E5E7EB'}`,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: '440px',
          maxHeight: '90vh',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '1.25rem',
          boxShadow: '0 24px 64px rgba(13,27,42,0.28)',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: '#0D1B2A' }}
        >
          <span className="text-lg font-extrabold">
            <span className="text-white">Ev Sor </span>
            <span style={{ color: '#2F80ED' }}>Bulsun</span>
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '18px' }}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <p className="text-xs text-center mb-4" style={{ color: '#6B7280' }}>
            Tekirdağ &amp; Çorlu'nun güvenilir emlak platformu
          </p>

          {/* ── REGISTER VIEW ── */}
          {authView === 'register' && (
            <>
              <h3 className="text-base font-bold text-center mb-4" style={{ color: '#0D1B2A' }}>
                🏠 Bireysel Üyelik Oluştur
              </h3>

              {registerSuccess && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl text-xs font-semibold"
                  style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}
                >
                  ✅ Üyeliğiniz oluşturuldu. Özel talep formunu doldurmak için lütfen giriş yapın.
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                      Ad <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      placeholder="Adınız"
                      value={reg.firstName}
                      onChange={e => updateReg('firstName', e.target.value)}
                      style={inputStyle(regErrors.firstName)}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${regErrors.firstName ? '#FCA5A5' : '#E5E7EB'}`)}
                    />
                    {regErrors.firstName && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{regErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                      Soyad <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      placeholder="Soyadınız"
                      value={reg.lastName}
                      onChange={e => updateReg('lastName', e.target.value)}
                      style={inputStyle(regErrors.lastName)}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${regErrors.lastName ? '#FCA5A5' : '#E5E7EB'}`)}
                    />
                    {regErrors.lastName && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{regErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    Telefon <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    placeholder="05XXXXXXXXX"
                    value={reg.phone}
                    onChange={e => updateReg('phone', e.target.value.replace(/\D/g,'').slice(0,11))}
                    style={inputStyle(regErrors.phone)}
                    onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                    onBlur={e => (e.target.style.border = `1.5px solid ${regErrors.phone ? '#FCA5A5' : '#E5E7EB'}`)}
                  />
                  {regErrors.phone && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{regErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    E-posta <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={reg.email}
                    onChange={e => updateReg('email', e.target.value)}
                    style={inputStyle(regErrors.email)}
                    onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                    onBlur={e => (e.target.style.border = `1.5px solid ${regErrors.email ? '#FCA5A5' : '#E5E7EB'}`)}
                  />
                  {regErrors.email && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{regErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    Şifre <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={reg.password}
                      onChange={e => updateReg('password', e.target.value)}
                      style={{ ...inputStyle(regErrors.password), paddingRight: '36px' }}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${regErrors.password ? '#FCA5A5' : '#E5E7EB'}`)}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#9CA3AF' }}>
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {regErrors.password && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{regErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#374151' }}>
                    Şifre Tekrar <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPw2 ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={reg.password2}
                      onChange={e => updateReg('password2', e.target.value)}
                      style={{ ...inputStyle(regErrors.password2), paddingRight: '36px' }}
                      onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                      onBlur={e => (e.target.style.border = `1.5px solid ${regErrors.password2 ? '#FCA5A5' : '#E5E7EB'}`)}
                    />
                    <button type="button" onClick={() => setShowPw2(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#9CA3AF' }}>
                      {showPw2 ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {regErrors.password2 && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{regErrors.password2}</p>}
                </div>

                <button
                  onClick={handleRegister}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90 active:scale-95 mt-1"
                  style={{ background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)', boxShadow: '0 4px 16px rgba(47,128,237,0.35)' }}
                >
                  Üyelik Oluştur
                </button>

                <p className="text-center text-xs pt-2" style={{ color: '#6B7280' }}>
                  Zaten hesabınız var mı?{' '}
                  <button
                    onClick={() => setAuthView('login')}
                    className="font-semibold hover:underline"
                    style={{ color: '#2F80ED' }}
                  >
                    Giriş Yap
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── LOGIN VIEW ── */}
          {authView === 'login' && (
            <>
              {/* Tab switcher */}
              <div
                className="flex rounded-xl p-1 mb-4"
                style={{ background: '#F5F7FA', border: '1px solid #E5E7EB' }}
              >
                {['bireysel', 'kurumsal'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={tab === t
                      ? { background: '#fff', color: '#2F80ED', boxShadow: '0 1px 6px rgba(47,128,237,0.13)', border: '1px solid #dbeafe' }
                      : { color: '#6B7280', background: 'transparent', border: '1px solid transparent' }
                    }
                  >
                    {t === 'bireysel' ? '🏠 Bireysel' : '🏢 Kurumsal'}
                  </button>
                ))}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>E-posta</label>
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={login.email}
                  onChange={e => updateLogin('email', e.target.value)}
                  style={inputStyle(false)}
                  onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                  onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')}
                />
              </div>

              {/* Şifre */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Şifre</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={login.password}
                    onChange={e => updateLogin('password', e.target.value)}
                    style={{ ...inputStyle(false), paddingRight: '36px' }}
                    onFocus={e => (e.target.style.border = '1.5px solid #2F80ED')}
                    onBlur={e => (e.target.style.border = '1.5px solid #E5E7EB')}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:opacity-70"
                    style={{ color: '#9CA3AF' }}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              {/* BİREYSEL */}
              {tab === 'bireysel' && (
                <>
                  <button
                    onClick={() => onLoginIndividual()}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90 active:scale-95 mb-4"
                    style={{ background: 'linear-gradient(90deg,#2F80ED,#1a6fd4)', boxShadow: '0 4px 16px rgba(47,128,237,0.35)' }}
                  >
                    Giriş Yap
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>veya</span>
                    <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <SocialButton icon={<GoogleIcon />} label="Google ile devam et" onClick={() => onLoginIndividual()} />
                    <SocialButton icon={<AppleIcon />}  label="Apple ile devam et"  onClick={() => onLoginIndividual()} />
                  </div>

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
                    <button
                      onClick={() => onGuestLogin()}
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#6B7280' }}
                    >
                      👤 Misafir Girişi
                    </button>
                    <button
                      onClick={() => setAuthView('register')}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: '#2F80ED' }}
                    >
                      Üye Ol →
                    </button>
                  </div>
                </>
              )}

              {/* KURUMSAL */}
              {tab === 'kurumsal' && (
                <>
                  <button
                    onClick={() => onLoginCorporate()}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(90deg,#0D1B2A,#1a3a5c)', boxShadow: '0 4px 16px rgba(13,27,42,0.3)' }}
                  >
                    Kurumsal Giriş
                  </button>
                  <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
                    Kurumsal hesap talebi için{' '}
                    <button
                      onClick={() => setShowAppModal(true)}
                      className="font-semibold hover:underline transition"
                      style={{ color: '#2F80ED' }}
                    >
                      başvurun
                    </button>
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-2.5 text-center text-xs flex-shrink-0"
          style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6', color: '#D1D5DB' }}
        >
          © 2025 Ev Sor Bulsun · Tüm hakları saklıdır
        </div>
      </div>

      {/* Kurumsal başvuru modalı */}
      {showAppModal && (
        <CorporateApplicationModal onClose={() => setShowAppModal(false)} />
      )}

    </div>
  );
}

function SocialButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition hover:bg-gray-50"
      style={{ border: '1.5px solid #E5E7EB', color: '#374151', background: '#fff' }}>
      {icon}{label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 814 1000" fill="#000">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663.4 0 541.8c0-207 134.3-316.7 266.1-316.7 81.9 0 150.3 54.2 201.5 54.2 48.8 0 126.4-57.3 220.1-57.3 33.5.1 134.3 4.5 200.5 100.8zm-222-208.6c-42.5 50.2-109.5 88.2-175.8 88.2a181.6 181.6 0 0 1-4.3-17.9c0-50.2 26.1-103.3 71.3-137.5 44.5-33.6 102.8-55.7 155.4-56.9.9 7 1.3 14.1 1.3 21.2 0 51.4-23.1 103-47.9 102.9z"/>
    </svg>
  );
}