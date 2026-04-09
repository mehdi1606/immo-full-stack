import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.jsx';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme(); // shared global state via ThemeProvider

  return (
    <div
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && toggle()}
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`flex w-14 h-7 p-0.5 rounded-full cursor-pointer transition-all duration-300 ${
        isDark
          ? 'bg-zinc-800 border border-zinc-700'
          : 'bg-neutral-200 border border-neutral-300'
      } ${className}`}
    >
      <div className="flex justify-between items-center w-full">
        {/* Sliding knob */}
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 shrink-0 ${
            isDark
              ? 'translate-x-0 bg-zinc-600'
              : 'translate-x-7 bg-white shadow-sm'
          }`}
        >
          {isDark
            ? <Moon size={13} className="text-white" strokeWidth={1.5} />
            : <Sun  size={13} className="text-amber-500" strokeWidth={1.5} />
          }
        </div>

        {/* Opposite icon (background side) */}
        <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0">
          {isDark
            ? <Sun  size={13} className="text-zinc-500" strokeWidth={1.5} />
            : <Moon size={13} className="text-neutral-400" strokeWidth={1.5} />
          }
        </div>
      </div>
    </div>
  );
}
