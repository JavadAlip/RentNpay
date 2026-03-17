/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#ea580c', 600: '#ea580c', 700: '#c2410c' }
      }
    }
  },
  plugins: []
};
