module.exports = {
  content: ['./public/**/*.html', './src/**/*.{js,jsx,ts,tsx,mdx}'],
  // specify other options here
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
