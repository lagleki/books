module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './templates/**/*.html',
    './data/**/*.md',
    './scripts/**/*.js',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            a: {
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline',
              }
            },
            'h1, h2, h3, h4': {
              fontWeight: '700',
              letterSpacing: '-0.025em',
            },
            p: {
              lineHeight: 1.6,
            }
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}