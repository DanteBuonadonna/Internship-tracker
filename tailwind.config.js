/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: { 50: '#FAF9F7', 100: '#F4F2EE', 200: '#E8E5DE', 300: '#D4CFC4', 400: '#A8A296', 500: '#6B6558', 600: '#4A453A', 700: '#2E2A22', 800: '#1F1C16', 900: '#13110D' },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
