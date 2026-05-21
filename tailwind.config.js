/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'water-light': '#E6F2FF',
        'water-medium': '#4A90E2',
        'water-dark': '#1A5F7A',
        'water-accent': '#87CEEB'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}