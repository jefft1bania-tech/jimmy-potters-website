/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Global — warm pottery studio palette
        brand: {
          'bg-primary': '#0C0A09',
          'bg-secondary': '#1C1917',
          'bg-footer': '#0A0908',
          'card': '#FFFFFF',
          'text': '#1E293B',
          'text-light': '#FFFFFF',
          'cta': '#92653A',
          'cta-hover': '#7A5430',
          'orange': '#C9A96E',
          'teal': '#14B8A6',
          'yellow': '#C9A96E',
          'border': '#E2E8F0',
        },
        // Accent colors — warm, earthy
        vibrant: {
          'teal': '#14B8A6',
          'teal-dark': '#0D9488',
          'purple': '#92653A',
          'purple-dark': '#7A5430',
          'purple-light': '#B8923E',
          'orange': '#C9A96E',
          'orange-dark': '#B8923E',
          'pink': '#D4A574',
          'lime': '#6B8F4A',
          'sky': '#F5F0EB',
          'lavender': '#F7F3EE',
          'peach': '#FBF5EE',
          'mint': '#ecfdf5',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Nunito', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
        '3xl': '24px',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 169, 110, 0.4)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(201, 169, 110, 0.15)' },
        },
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
