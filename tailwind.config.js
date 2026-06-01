/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        uide: {
          primary: '#003087',
          secondary: '#0057B7',
          dark: '#001F5B',
          accent: '#E8500A',
          light: '#E8F0FE',
        },
      },
    },
  },
  plugins: [],
}
