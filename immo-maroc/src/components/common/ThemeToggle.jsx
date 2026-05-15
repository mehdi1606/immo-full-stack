import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.jsx';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
        isDark ? 'bg-slate-700' : 'bg-neutral-200'
      } ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Sliding knob */}
      <span
        className={`absolute top-0.5 left-0.5 flex items-center justify-center w-6 h-6 rounded-full shadow transition-transform duration-300 will-change-transform ${
          isDark ? 'translate-x-7 bg-slate-900' : 'translate-x-0 bg-white'
        }`}
        aria-hidden="true"
      >
        {isDark
          ? <Moon size={12} className="text-blue-300" strokeWidth={1.5} />
          : <Sun  size={12} className="text-amber-500" strokeWidth={1.5} />
        }
      </span>
    </button>
  );
}
