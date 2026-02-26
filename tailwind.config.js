/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f5f5dc',
        secondary: '#a08070',
        muted: '#606060',
        gold: '#c9a227',
        danger: '#8b0000',
        bg: {
          primary: '#0a0a0f',
          secondary: '#1a0a0f',
          card: '#151018',
        },
        border: {
          default: 'rgba(120, 100, 80, 0.2)',
          hover: 'rgba(120, 100, 80, 0.4)',
        },
      },
    },
  },
  plugins: [],
}