module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
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
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
