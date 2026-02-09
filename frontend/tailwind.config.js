/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#FF5A5F',
        secondary: '#008489',
        'background-light': '#FFFFFF',
        'background-dark': '#1F2937',
        'surface-light': '#F7F7F7',
        'surface-dark': '#111827',
        'card-light': '#FFFFFF',
        'card-dark': '#374151',
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'hover': '0 10px 25px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

