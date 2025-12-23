/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#162B46', // Legacy deep navy (kept for any remaining references)
          800: '#1F3A5F',
          500: '#4A6FA5',
          50: '#E9EEF4',
          25: '#F5F7FA',
          accent: '#D6B56A',
          accentBright: '#E9C979', // Slightly brighter accent for dark mode highlights
        },
        dark: {
          base: '#0D111C', // Neutral ink background for dark mode body
          surface: '#161C2B', // Primary card/background surface
          surfaceAlt: '#1F2739', // Elevated panels / modals
          border: '#273047', // Default outline/border
          borderStrong: '#37405A', // Stronger outline for separators
          text: '#F1F4FF', // High-contrast text
          muted: '#9AA5BD', // Secondary text/icons
        },
      },
    },
  },
  plugins: [],
}
