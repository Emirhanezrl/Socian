/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1DA1F2',
        secondary: '#1991DA'
      },
      borderRadius: {
        button: '8px'
      }
    }
  },
  plugins: [],
}
