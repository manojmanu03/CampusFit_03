/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#970747',
        secondary: '#b80d67',
        accent: '#e24a8e',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(151,7,71,0.15)',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(180deg, rgba(151,7,71,0.08), rgba(255,255,255,0))',
      },
    },
  },
  plugins: [],
}
