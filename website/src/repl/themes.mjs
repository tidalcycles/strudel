import {
  abcdef,
  androidstudio,
  atomone,
  aura,
  bespin,
  darcula,
  dracula,
  duotoneDark,
  eclipse,
  githubDark,
  gruvboxDark,
  materialDark,
  nord,
  okaidia,
  solarizedDark,
  sublime,
  tokyoNight,
  tokyoNightStorm,
  vscodeDark,
  xcodeDark,
  bbedit,
  duotoneLight,
  githubLight,
  gruvboxLight,
  materialLight,
  noctisLilac,
  solarizedLight,
  tokyoNightDay,
  xcodeLight,
} from '@uiw/codemirror-themes-all';

export const themes = {
  abcdef,
  androidstudio,
  atomone,
  aura,
  bespin,
  darcula,
  dracula,
  duotoneDark,
  eclipse,
  githubDark,
  gruvboxDark,
  materialDark,
  nord,
  okaidia,
  solarizedDark,
  sublime,
  tokyoNight,
  tokyoNightStorm,
  vscodeDark,
  xcodeDark,
  bbedit,
  duotoneLight,
  githubLight,
  gruvboxLight,
  materialLight,
  noctisLilac,
  solarizedLight,
  tokyoNightDay,
  xcodeLight,
};
// TODO: persist theme
export const defaultSettingsAura = {
  background: '#21202e',
  foreground: '#edecee',
  caret: '#a277ff',
  selection: '#3d375e7f',
  selectionMatch: '#3d375e7f',
  gutterBackground: '#21202e',
  gutterForeground: '#edecee',
  gutterBorder: 'transparent',
  lineHighlight: '#a394f033',
};

export const vars = {
  abcdef: {
    bg: '#0f0f0f',
    activeLine: '#314151',
  },
};

function getColors(str) {
  const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g;
  const colors = [];

  let match;
  while ((match = colorRegex.exec(str)) !== null) {
    const color = match[0];
    if (!colors.includes(color)) {
      colors.push(color);
    }
  }

  return colors;
}

export function themeColors(theme) {
  return getColors(stringifySafe(theme));
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

function stringifySafe(json) {
  return JSON.stringify(json, getCircularReplacer());
}
