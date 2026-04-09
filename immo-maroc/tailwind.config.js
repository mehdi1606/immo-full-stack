/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF4FB',
          100: '#D5E6F5',
          200: '#ABCDE9',
          300: '#7FB3DC',
          400: '#4D93CC',
          500: '#1B6CB5',
          600: '#1B4F72',
          700: '#164260',
          800: '#10334D',
          DEFAULT: '#1B4F72',
        },
        accent: {
          50:  '#FDF8EC',
          100: '#FAF0CF',
          200: '#F5DE9C',
          300: '#EEC659',
          400: '#E6AF26',
          500: '#C9922A',
          DEFAULT: '#C9922A',
          600: '#A87420',
          700: '#7A5218',
        },
        success: '#22C55E',
        danger:  '#EF4444',
        warning: '#F59E0B',
        neutral: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        cream: '#FDF8F3',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        card:       '0 2px 16px rgba(0,0,0,0.07)',
        'card-lg':  '0 8px 40px rgba(0,0,0,0.12)',
        dropdown:   '0 10px 40px rgba(0,0,0,0.12)',
        inner:      'inset 0 2px 4px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'fade-in':   'fadeIn 0.3s ease forwards',
        'slide-in':  'slideIn 0.3s ease forwards',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(-12px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}

