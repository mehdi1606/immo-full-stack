import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { login } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError(t('login.emptyFields')); return; }
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (!result.success) { setError(t('login.invalidCredentials')); return; }
    navigate(result.role?.toUpperCase() === 'ADMIN' ? '/admin' : '/agent', { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0D1A2D] relative overflow-hidden flex-col justify-between p-12">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-primary/20 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full bg-accent/10 translate-y-1/3 -translate-x-1/3" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2.5 text-white w-fit">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Home size={17} className="text-white" />
          </div>
          <span className="font-serif text-xl font-bold">Immo<span className="text-accent">Maroc</span></span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Espace professionnel
          </div>
          <h2 className="font-serif text-4xl font-bold text-white leading-tight">
            Bienvenue sur<br />
            <span className="text-accent">IMMO 21</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Gérez vos biens, suivez vos leads et développez votre activité immobilière depuis un seul espace.
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} IMMO 21. Tous droits réservés.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Home size={15} className="text-white" />
            </div>
            <span className="font-serif text-lg font-bold text-neutral-900">Immo<span className="text-primary">Maroc</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold text-neutral-900 mb-1">{t('login.title')}</h1>
            <p className="text-neutral-400 text-sm">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 mb-6">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">{t('login.emailLabel')}</label>
              <input
                type="email"
                className="form-input"
                placeholder="vous@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('login.passwordLabel')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('login.loggingIn')}
                </span>
              ) : (
                <span className="flex items-center gap-2"><LogIn size={15} /> {t('login.loginBtn')}</span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-400 mt-8">
            <Link to="/" className="hover:text-primary transition-colors">{t('login.backToSite')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
