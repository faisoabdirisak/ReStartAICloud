/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design system tokens
        background: {
          light: '#F8FAFC',
          dark: '#0D1117',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#161B22',
        },
        'surface-elevated': {
          light: '#F1F5F9',
          dark: '#21262D',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': {
          light: '#0F172A',
          dark: '#F0F6FC',
        },
        'text-muted': {
          light: '#64748B',
          dark: '#8B949E',
        },
        border: {
          light: '#E2E8F0',
          dark: '#30363D',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.15)',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.3)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.2)' },
          '56%': { transform: 'scale(1)' },
        },
      },
      animation: {
        heartbeat: 'heartbeat 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
