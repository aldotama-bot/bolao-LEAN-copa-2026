/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        copa: { green: '#1a9e3f', dark: '#0f7a2e', gold: '#d4a017' }
      }
    }
  },
  plugins: []
}