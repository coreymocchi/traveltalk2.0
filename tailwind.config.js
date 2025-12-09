/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-fg': 'var(--primary-fg)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
      }
    },
  },
  plugins: [],
}
