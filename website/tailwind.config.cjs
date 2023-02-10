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
      colors: {
        primary: '#c792ea',
        secondary: '#c3e88d',
        tertiary: '#82aaff',
        highlight: '#ffcc00',
        linegray: '#8a91991a',
        lineblack: '#00000095',
        bg: '#222222',
        // header: '#8a91991a',
        // footer: '#8a91991a',
        header: '#00000050',
        // header: 'transparent',
        footer: '#00000050',
        // codemirror-theme settings
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        caret: 'var(--caret)',
        selection: 'var(--selection)',
        selectionMatch: 'var(--selectionMatch)',
        gutterBackground: 'var(--gutterBackground)',
        gutterForeground: 'var(--gutterForeground)',
        gutterBorder: 'var(--gutterBorder)',
        lineHighlight: 'var(--lineHighlight)',
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
  plugins: [require('@tailwindcss/typography')],
};
