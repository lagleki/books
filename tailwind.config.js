module.exports = {
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