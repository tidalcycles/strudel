/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../packages/react/src/**/*.{html,js,jsx,md,mdx,ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        train: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        train: 'train 2s linear infinite',
      },
      colors: {
        // codemirror-theme settings
        background: 'var(--background)',
        lineBackground: 'var(--lineBackground)',
        foreground: 'var(--foreground)',
        caret: 'var(--caret)',
        selection: 'var(--selection)',
        selectionMatch: 'var(--selectionMatch)',
        gutterBackground: 'var(--gutterBackground)',
        gutterForeground: 'var(--gutterForeground)',
        gutterBorder: 'var(--gutterBorder)',
        lineHighlight: 'var(--lineHighlight)',
      },
      spacing: {
        'app-height': 'var(--app-height)',
      },
      typography(theme) {
        return {
          DEFAULT: {
            css: {
              'code::before': {
                content: 'none', // don’t wrap code in backticks
              },
              'code::after': {
                content: 'none',
              },
            },
          },
        };
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
