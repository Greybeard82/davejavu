const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F6',
        'canvas-alt': '#f4f3ef',
        charcoal: '#36454F',
        'mid-gray': '#8a8a8a',
        'border-dim': '#d1d1d1',
        orange: '#F07E2F',
        'orange-dark': '#d46a20',
        blue: '#1E90FF',
        green: '#32CD32',
        teal: '#4EC7D4',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', ...fontFamily.sans],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease forwards',
        'slide-up': 'slideUp 0.8s ease forwards',
      },
    },
  },
  plugins: [],
};
