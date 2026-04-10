import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#FFF7F0',
          100: '#FFEDD9',
          200: '#FFD9B3',
          300: '#FFC187',
          400: '#FFA463',
          500: '#FF8A4C',
          600: '#F26A2E',
          700: '#C9521F',
          800: '#8F3A15',
          900: '#5C2510',
        },
        cream: {
          50: '#FFFBF5',
          100: '#FFF4E6',
          200: '#FFE8CC',
        },
        coral: {
          400: '#FF7E5F',
          500: '#FF6A45',
          600: '#E8502A',
        },
        ink: {
          900: '#2B1810',
          800: '#3D2317',
          700: '#5C3524',
          600: '#7A4B34',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        peach: '0 1px 2px rgba(242, 106, 46, 0.08), 0 16px 48px -20px rgba(242, 106, 46, 0.28)',
        'peach-sm': '0 1px 2px rgba(242, 106, 46, 0.06), 0 6px 20px -8px rgba(242, 106, 46, 0.18)',
        soft: '0 1px 2px rgba(45, 24, 16, 0.03), 0 1px 1px rgba(45, 24, 16, 0.02), 0 8px 24px -12px rgba(45, 24, 16, 0.06)',
        card: '0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 1px 2px rgba(45, 24, 16, 0.04), 0 12px 32px -16px rgba(45, 24, 16, 0.08)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
        'drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'pulse-peach': 'pulse-peach 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 520ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'line-draw': 'line-draw 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'pulse-peach': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.08)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'line-draw': {
          '0%': { strokeDashoffset: '100%' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
