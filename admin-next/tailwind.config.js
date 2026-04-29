/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/admin-pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/Admin/**/*.{js,ts,jsx,tsx,mdx}',
    './src/Vendor/**/*.{js,ts,jsx,tsx,mdx}',
    './src/Common/**/*.{js,ts,jsx,tsx,mdx}',
    './src/redux/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: { DEFAULT: '#ea580c', 600: '#ea580c', 700: '#c2410c' },
      },
    },
  },
  plugins: [],
  fontFamily: {
    manrope: ['Manrope', 'sans-serif'],
  },
};
