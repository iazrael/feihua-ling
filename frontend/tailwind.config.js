/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#e8f4f8',
          DEFAULT: '#1e3a5f',
          dark: '#0f1f3d',
        },
        accent: {
          light: '#f5e6d3',
          DEFAULT: '#d4af37',
          dark: '#b8941f',
        },
      },
      fontFamily: {
        serif: ['KaiTi', 'STKaiti', '楷体', 'serif'],
      },
    },
  },
  plugins: [],
}