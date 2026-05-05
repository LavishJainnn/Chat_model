/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#fdfbf7',
          100: '#f7f3e9',
          200: '#eee7d3',
          300: '#e2d4b3',
        },
        terracotta: {
          DEFAULT: '#e2725b',
          dark: '#c05a46',
        },
        brown: {
          700: '#5d4037',
          800: '#4e342e',
          900: '#3e2723',
        }
      }
    },
  },
  plugins: [],
}
