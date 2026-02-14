module.exports = {
  darkMode: 'class',
  content: [
    './templates/**/*.html',
    './data/**/*.md',
    './scripts/**/*.js',
    './docs/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        'reading': '70ch',
        'content': '75rem',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '70ch',
            color: 'inherit',
            a: {
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            'h1, h2, h3, h4': {
              fontWeight: '700',
              letterSpacing: '-0.025em',
            },
            p: {
              lineHeight: '1.75',
            },
            'pre, pre code': {
              maxWidth: 'none',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}