/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          950: '#0a1b3f',
          900: '#0f2b6b',
          800: '#143a8a',
          700: '#1d4ed8',
          500: '#3b82f6',
        },
        gold: {
          500: '#d9b25b',
        }
      }
    },
  },
  plugins: [],
}
