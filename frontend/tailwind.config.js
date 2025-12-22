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
          950: '#162B46', // Darkest navy - dark mode backgrounds, header
          800: '#1F3A5F', // Dark navy - dark mode surfaces, header gradient
          500: '#4A6FA5', // Medium blue - primary interactive elements
          50: '#E9EEF4',  // Very light blue-gray - light mode background
          25: '#F5F7FA',  // Almost white - light mode surfaces/cards
          accent: '#D6B56A', // Golden highlight accent
        },
      },
    },
  },
  plugins: [],
}
