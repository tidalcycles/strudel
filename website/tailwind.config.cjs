/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
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
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
