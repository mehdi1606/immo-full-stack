import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronDown, LogOut, LayoutDashboard, User, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';

/* ─── Languages ──────────────────────────────────────────────── */
const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'en', label: 'English',  short: 'EN', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'ar', label: 'العربية', short: 'AR', flag: 'https://flagcdn.com/w40/ma.png' },
];

/* ─── Floating pill nav link ────────────────────────────────── */
function PillLink({ to, end, label, pill }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap ${
          isActive
            ? pill === 'glass'
              ? 'bg-white/20 text-white'
              : 'bg-primary/10 text-primary'
            : pill === 'glass'
            ? 'text-white/80 hover:text-white hover:bg-white/12'
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [scrollDir, setScrollDir]   = useState('up');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu]     = useState(false);
  const [langOpen, setLangOpen]     = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const lastScrollY                 = useRef(0);
  const userMenuRef                 = useRef(null);
  const langRef                     = useRef(null);
  const { user, logout }            = useApp();
  const navigate                    = useNavigate();
  const location                    = useLocation();
  const { t, i18n }                 = useTranslation();
  const { isDark }                  = useTheme();
  const isHome                      = location.pathname === '/';
  const transparent                 = isHome && !scrolled;
  const pillMode                    = transparent ? 'glass' : 'solid';

  /* ── Scroll listener ── */
  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setScrollDir(y < lastScrollY.current ? 'up' : 'down');
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* ── Close on route change ── */
  useEffect(() => { setMobileOpen(false); setUserMenu(false); setMobileLangOpen(false); }, [location]);

  /* ── Click-outside user menu & lang dropdown ── */
  useEffect(() => {
    const fn = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenu(false);
      if (langRef.current && !langRef.current.contains(e.target))
        setLangOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout  = () => { logout(); navigate('/'); setUserMenu(false); };
  const dashPath      = user?.role?.toLowerCase() === 'admin' ? '/admin' : '/agent';
  const currentLang   = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
  const selectLang    = (code) => { i18n.changeLanguage(code); setLangOpen(false); };

  const links = [
    { label: t('nav.home'),     path: '/',          end: true  },
    { label: t('nav.listings'), path: '/recherche', end: false },
    { label: t('nav.sell'),     path: '/vendre',    end: false },
    { label: t('nav.contact'),  path: '/contact',   end: false },
  ];

  /* ── Pill background ── */
  const pillBg = transparent
    ? 'bg-white/10 backdrop-blur-xl border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.18)]'
    : isDark
      ? 'bg-slate-900 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.35)]'
      : 'bg-white border border-neutral-200/70 shadow-[0_4px_30px_rgba(0,0,0,0.09)]';

  /* ── Hide on scroll-down (only when solid) ── */
  const hidden = !transparent && scrollDir === 'down';

  return (
    <>
      {/* ══ Floating pill wrapper ════════════════════════════════════ */}
      <div
        dir="ltr"
        className={`fixed inset-x-0 z-50 flex justify-center transition-all duration-500 ${
          transparent ? 'top-4' : 'top-3'
        } ${hidden ? '-translate-y-[140%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <div className="w-[90%] max-w-[980px]">

          {/* ── The Pill ── */}
          <div className={`flex items-center gap-4 px-5 py-2.5 rounded-full transition-all duration-500 ${pillBg}`}>

            {/* ─── Logo ──────────────────────────────────────────── */}
            <Link to="/" className="flex items-center shrink-0 mr-2">
              <img
                src="/img/logo.webp"
                alt="Immo 21"
                className="h-11 w-auto"
              />
            </Link>

            {/* ─── Desktop nav links (center) ─────────────────── */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {links.map(l => (
                <PillLink
                  key={l.path}
                  to={l.path}
                  end={l.end}
                  label={l.label}
                  pill={pillMode}
                />
              ))}
            </nav>

            {/* ─── Right controls ─────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-2 shrink-0 ml-1">

              {/* ── Theme toggle ── */}
              <ThemeToggle />

              {/* ── Flag language dropdown ── */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen(v => !v)}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    transparent
                      ? 'border-white/30 text-white hover:bg-white/15'
                      : isDark
                      ? 'border-white/10 text-slate-200 hover:bg-white/8'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <img src={currentLang.flag} alt={currentLang.short} className="w-5 h-3.5 rounded-sm object-cover shadow-sm" />
                  <span>{currentLang.short}</span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {langOpen && (
                  <div className={`absolute right-0 top-[calc(100%+8px)] w-44 rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.18)] ring-1 animate-fade-in z-50 ${
                    isDark ? 'bg-slate-800 ring-white/10' : 'bg-white/95 backdrop-blur-xl ring-black/5'
                  }`}>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => selectLang(lang.code)}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors ${
                          currentLang.code === lang.code
                            ? isDark ? 'bg-primary/20 text-primary font-semibold' : 'bg-primary/8 text-primary font-semibold'
                            : isDark ? 'text-slate-300 hover:bg-white/6 hover:text-white' : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <img src={lang.flag} alt={lang.short} className="w-6 h-4 rounded-sm object-cover shadow-sm shrink-0" />
                        <span className="flex-1">{lang.label}</span>
                        {currentLang.code === lang.code && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Logged-in user pill */}
              {user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenu(v => !v)}
                    className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border ${
                      transparent
                        ? 'border-white/30 text-white hover:bg-white/12'
                        : isDark
                        ? 'border-white/10 text-slate-200 hover:bg-white/8'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden xl:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${userMenu ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown */}
                  {userMenu && (
                    <div className={`absolute right-0 top-[calc(100%+10px)] w-56 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] ring-1 animate-fade-in ${
                      isDark ? 'bg-slate-800 ring-white/10' : 'bg-white ring-black/5'
                    }`}>
                      {/* user info */}
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>{user.name}</p>
                        <p className={`text-xs capitalize ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}>{user.role}</p>
                      </div>
                      <div className="py-1.5">
                        <Link
                          to={dashPath}
                          onClick={() => setUserMenu(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary'
                          }`}
                        >
                          <LayoutDashboard size={14} /> {t('nav.dashboard')}
                        </Link>
                        {user?.role?.toLowerCase() === 'admin' ? (
                          <Link
                            to="/admin/agents"
                            onClick={() => setUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary'
                            }`}
                          >
                            <User size={14} /> Agents
                          </Link>
                        ) : (
                          <Link
                            to="/agent/profil"
                            onClick={() => setUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary'
                            }`}
                          >
                            <User size={14} /> {t('nav.profile')}
                          </Link>
                        )}
                      </div>
                      <div className={`border-t ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors ${
                            isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                          }`}
                        >
                          <LogOut size={14} /> {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Mobile hamburger ───────────────────────────── */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className={`lg:hidden ml-auto w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-full transition-all ${
                transparent ? 'hover:bg-white/12' : isDark ? 'hover:bg-white/8' : 'hover:bg-neutral-100'
              }`}
              aria-label="Menu"
            >
              <span className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${
                mobileOpen ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5'
              } ${transparent ? 'bg-white' : isDark ? 'bg-slate-300' : 'bg-neutral-700'}`} />
              <span className={`block h-0.5 rounded-full transition-all duration-300 ${
                mobileOpen ? 'w-0 opacity-0' : 'w-3.5'
              } ${transparent ? 'bg-white' : isDark ? 'bg-slate-300' : 'bg-neutral-700'}`} />
              <span className={`block h-0.5 rounded-full transition-all duration-300 origin-center ${
                mobileOpen ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-5'
              } ${transparent ? 'bg-white' : isDark ? 'bg-slate-300' : 'bg-neutral-700'}`} />
            </button>

          </div>
        </div>
      </div>

      {/* ══ Mobile drawer ════════════════════════════════════════════ */}
      {/* z-[60] → above the floating pill (z-50) so it fully covers it */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
        mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer panel — full width on phones, capped on tablets */}
        <div className={`absolute top-0 right-0 h-full w-full sm:max-w-[320px] flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-slate-900' : 'bg-white'}`}>

          {/* Top ridge accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-5 border-b ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center">
              <img src="/img/logo.webp" alt="Immo 21" className="h-12 w-auto" />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className={`p-2.5 rounded-xl transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <X size={22} />
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
              <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/30" />
              <div>
                <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>{user.name}</p>
                <p className={`text-xs capitalize ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}>{user.role}</p>
              </div>
            </div>
          )}

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {links.map((l, i) => (
              <NavLink
                key={l.path}
                to={l.path}
                end={l.end}
                style={{ transitionDelay: mobileOpen ? `${i * 50}ms` : '0ms' }}
                className={({ isActive }) =>
                  `flex items-center px-5 py-4 rounded-2xl text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : isDark
                      ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to={dashPath}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : isDark
                      ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`
                }
              >
                <LayoutDashboard size={15} /> {t('nav.dashboard')}
              </NavLink>
            )}
          </nav>

          {/* Bottom controls */}
          <div className={`px-5 py-5 border-t space-y-4 ${isDark ? 'border-white/10' : 'border-neutral-100'}`}>
            {/* Theme toggle row */}
            <div className={`flex items-center justify-between px-5 py-4 rounded-2xl ${
              isDark ? 'bg-white/5' : 'bg-neutral-50'
            }`}>
              <span className={`text-base font-semibold ${isDark ? 'text-slate-300' : 'text-neutral-700'}`}>
                {isDark ? '🌙 Mode sombre' : '☀️ Mode clair'}
              </span>
              <ThemeToggle />
            </div>

            {/* Language dropdown */}
            <div>
              <button
                onClick={() => setMobileLangOpen(v => !v)}
                className={`flex items-center w-full px-5 py-4 rounded-2xl text-base font-semibold transition-all ${
                  isDark
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <img src={currentLang.flag} alt={currentLang.short} className="w-6 h-4 rounded-sm object-cover shadow-sm mr-3" />
                <span className="flex-1 text-left">{currentLang.label}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${mobileLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded language options */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                mobileLangOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
                <div className={`ml-4 rounded-2xl overflow-hidden border ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-neutral-100 bg-neutral-50/50'
                }`}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { selectLang(lang.code); setMobileLangOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium transition-colors ${
                        currentLang.code === lang.code
                          ? 'bg-primary/10 text-primary font-semibold'
                          : isDark
                          ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <img src={lang.flag} alt={lang.short} className="w-6 h-4 rounded-sm object-cover shadow-sm" />
                      <span className="flex-1 text-left">{lang.label}</span>
                      {currentLang.code === lang.code && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-500 transition-colors ${
                  isDark ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-red-50 hover:bg-red-100'
                }`}
              >
                <LogOut size={14} /> {t('nav.logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
