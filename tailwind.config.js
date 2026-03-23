/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Global / Shop theme — sophisticated, neutral
        brand: {
          'bg-primary': '#1A1F5E',
          'bg-secondary': '#2B3A8C',
          'bg-footer': '#0F1340',
          'card': '#FFFFFF',
          'text': '#1E293B',
          'text-light': '#FFFFFF',
          'cta': '#7C3AED',
          'cta-hover': '#6D28D9',
          'orange': '#E85D26',
          'teal': '#14B8A6',
          'yellow': '#FBBF24',
          'border': '#E2E8F0',
        },
        // Classes portal — vibrant, kid-focused
        vibrant: {
          'teal': '#38bdf8',
          'teal-dark': '#0ea5e9',
          'purple': '#a855f7',
          'purple-dark': '#9333ea',
          'purple-light': '#c084fc',
          'orange': '#f97316',
          'orange-dark': '#ea580c',
          'pink': '#ec4899',
          'lime': '#84cc16',
          'sky': '#e0f2fe',
          'lavender': '#f3e8ff',
          'peach': '#fff7ed',
          'mint': '#ecfdf5',
        },
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
        '3xl': '24px',
        'blob': '63% 37% 30% 70% / 50% 45% 55% 50%',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(3deg)' },
        },
        'blob': {
          '0%, 100%': { borderRadius: '63% 37% 30% 70% / 50% 45% 55% 50%' },
          '25%': { borderRadius: '37% 63% 51% 49% / 37% 65% 35% 63%' },
          '50%': { borderRadius: '50% 50% 33% 67% / 55% 27% 73% 45%' },
          '75%': { borderRadius: '33% 67% 58% 42% / 63% 38% 62% 37%' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(168, 85, 247, 0.15)' },
        },
        'count-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'blob': 'blob 8s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'count-pulse': 'count-pulse 0.6s ease-in-out',
      },
    },
  },
  plugins: [],
};
