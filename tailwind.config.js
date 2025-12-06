/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#C17A4A',
          DEFAULT: '#C17A4A',
          dark: '#D89B73',
        },
      },
    },
  },
  plugins: [],
}