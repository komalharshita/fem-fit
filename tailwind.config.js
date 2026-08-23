/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyberBlack: '#080808',
        neonLime: '#B5E61D',
        amberWarning: '#F2C94C',
        criticalRed: '#EF4444',
      }
    },
  },
  plugins: [],
}
