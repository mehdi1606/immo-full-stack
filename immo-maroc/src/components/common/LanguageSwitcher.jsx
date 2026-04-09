import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English',  short: 'EN' },
  { code: 'ar', label: 'العربية',  short: 'عر' },
];

export default function LanguageSwitcher({ transparent = false }) {
  const { i18n } = useTranslation();
  const current   = i18n.language?.slice(0, 2) || 'fr';
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === current) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      {/* Globe trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        title="Langue / Language"
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all ${
          transparent
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Globe size={17} strokeWidth={1.8} />
        <span className="text-xs font-bold tracking-wide">{currentLang.short}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-dropdown py-1.5 z-50 animate-fade-in">
          {LANGUAGES.map(({ code, label, short }) => (
            <button
              key={code}
              onClick={() => { i18n.changeLanguage(code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                current === code
                  ? 'text-primary font-semibold bg-primary/5'
                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <span className="w-7 text-xs font-bold text-neutral-400">{short}</span>
              <span>{label}</span>
              {current === code && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
