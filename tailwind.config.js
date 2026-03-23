/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
      },
    },
  },
  plugins: [],
};
