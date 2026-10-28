/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tilte: {
          navy: '#002837',
          slate: '#405E69',
          muted: '#80949B',
          soft: '#BFC9CE',
          wine: '#741532',
          plum: '#4D1B34',
          red: '#FF002D',
        }
      }
    },
  },
  plugins: [],
}