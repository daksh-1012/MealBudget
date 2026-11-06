/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { 50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 600: '#15803D', 700: '#166534', 800: '#14532D' },
        canvas: '#F8FAF8',
        ink: '#1F2937',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
