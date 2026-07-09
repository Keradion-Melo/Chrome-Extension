// tailwind.config.js
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        melo: {
          primary: '#E0645D',
          'primary-hover': '#C94F48',
          'primary-light': '#F5B7B3',
          dark: 'var(--melo-bg, #171820)',
          'dark-surface': 'var(--melo-surface, #1E212B)',
          'dark-hover': 'var(--melo-surface-hover, #282C38)',
          'text-primary-dark': 'var(--melo-text-primary, #F4F1F2)',
          'text-secondary-dark': 'var(--melo-text-secondary, #C5C3C8)',
          'text-subdued': 'var(--melo-text-subdued, #7E869B)',
          border: 'var(--melo-border, rgba(255, 255, 255, 0.08))',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(224, 100, 93, 0.15)',
        elevated: '0 12px 48px rgba(0, 0, 0, 0.8)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
};
