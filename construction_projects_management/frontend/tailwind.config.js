/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",   // <--- IMPORTANT
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#F6F9FB',
        'brand-side': '#6C5CE7',
        'brand-muted': '#E9F2FF',
        'accent-1': '#8A7BFF',
        'accent-2': '#4FD1C5',
        'danger': '#FF6B6B',
        'warn': '#FFB86B',
        'ok': '#25D366'
      },
      boxShadow: {
        'soft': '0 6px 18px rgba(18, 28, 68, 0.08)',
      },
    },
  },
  plugins: [],
};
