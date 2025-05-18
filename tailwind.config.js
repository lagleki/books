module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './templates/**/*.html',
    './data/**/*.md',
    './scripts/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}