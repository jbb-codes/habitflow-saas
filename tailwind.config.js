/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        habit: {
          red: '#ef4444',
          blue: '#3b82f6',
          green: '#22c55e',
          purple: '#8b5cf6',
          orange: '#f97316',
          teal: '#14b8a6',
        },
      },
    },
  },
  plugins: [],
}
