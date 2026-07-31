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
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4361ee',
          600: '#3a56d4',
          700: '#2b44b8',
          900: '#1b2a75'
        },
        purple: {
          500: '#7209b7',
          600: '#5e08a0'
        },
        accent: {
          500: '#f72585',
          600: '#d81170'
        }
      }
    },
  },
  plugins: [],
}
