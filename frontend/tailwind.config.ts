import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1F3A5F',
        secondary: '#162B46',
        accent: '#4A6FA5',
        'surface-light': '#E9EEF4',
        'surface-soft': '#F5F7FA'
      }
    }
  },
  plugins: []
} satisfies Config;
