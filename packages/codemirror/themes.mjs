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

import strudelTheme from './themes/strudel-theme';
import bluescreen, { settings as bluescreenSettings } from './themes/bluescreen';
import blackscreen, { settings as blackscreenSettings } from './themes/blackscreen';
import whitescreen, { settings as whitescreenSettings } from './themes/whitescreen';
import teletext, { settings as teletextSettings } from './themes/teletext';
import algoboy, { settings as algoboySettings } from './themes/algoboy';
import terminal, { settings as terminalSettings } from './themes/terminal';
import { setTheme } from '@strudel/draw';

export const themes = {
  strudelTheme,
  bluescreen,
  blackscreen,
  whitescreen,
  teletext,
  algoboy,
  terminal,
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

// lineBackground is background with 50% opacity, to make sure the selection below is visible

export const settings = {
  strudelTheme: {
    background: '#222',
    lineBackground: '#22222299',
    foreground: '#fff',
    // foreground: '#75baff',
    caret: '#ffcc00',
    selection: 'rgba(128, 203, 196, 0.5)',
    selectionMatch: '#036dd626',
    // lineHighlight: '#8a91991a', // original
    lineHighlight: '#00000050',
    gutterBackground: 'transparent',
    // gutterForeground: '#8a919966',
    gutterForeground: '#8a919966',
  },
  bluescreen: bluescreenSettings,
  blackscreen: blackscreenSettings,
  whitescreen: whitescreenSettings,
  teletext: teletextSettings,
  algoboy: algoboySettings,
  terminal: terminalSettings,
  abcdef: {
    background: '#0f0f0f',
    lineBackground: '#0f0f0f99',
    foreground: '#defdef',
    caret: '#00FF00',
    selection: '#515151',
    selectionMatch: '#515151',
    gutterBackground: '#555',
    gutterForeground: '#FFFFFF',
    lineHighlight: '#314151',
  },
  androidstudio: {
    background: '#282b2e',
    lineBackground: '#282b2e99',
    foreground: '#a9b7c6',
    caret: '#00FF00',
    selection: '#343739',
    selectionMatch: '#343739',
    lineHighlight: '#343739',
  },
  atomone: {
    background: '#272C35',
    lineBackground: '#272C3599',
    foreground: '#9d9b97',
    caret: '#797977',
    selection: '#ffffff30',
    selectionMatch: '#2B323D',
    gutterBackground: '#272C35',
    gutterForeground: '#465063',
    gutterBorder: 'transparent',
    lineHighlight: '#2B323D',
  },
  aura: {
    background: '#21202e',
    lineBackground: '#21202e99',
    foreground: '#edecee',
    caret: '#a277ff',
    selection: '#3d375e7f',
    selectionMatch: '#3d375e7f',
    gutterBackground: '#21202e',
    gutterForeground: '#edecee',
    gutterBorder: 'transparent',
    lineHighlight: '#a394f033',
  },
  bbedit: {
    light: true,
    background: '#FFFFFF',
    lineBackground: '#FFFFFF99',
    foreground: '#000000',
    caret: '#FBAC52',
    selection: '#FFD420',
    selectionMatch: '#FFD420',
    gutterBackground: '#f5f5f5',
    gutterForeground: '#4D4D4C',
    gutterBorder: 'transparent',
    lineHighlight: '#00000012',
  },
  bespin: {
    background: '#28211c',
    lineBackground: '#28211c99',
    foreground: '#9d9b97',
    caret: '#797977',
    selection: '#36312e',
    selectionMatch: '#4f382b',
    gutterBackground: '#28211c',
    gutterForeground: '#666666',
    lineHighlight: 'rgba(255, 255, 255, 0.1)',
  },
  darcula: {
    background: '#2B2B2B',
    lineBackground: '#2B2B2B99',
    foreground: '#f8f8f2',
    caret: '#FFFFFF',
    selection: 'rgba(255, 255, 255, 0.1)',
    selectionMatch: 'rgba(255, 255, 255, 0.2)',
    gutterBackground: 'rgba(255, 255, 255, 0.1)',
    gutterForeground: '#999',
    gutterBorder: 'transparent',
    lineHighlight: 'rgba(255, 255, 255, 0.1)',
  },
  dracula: {
    background: '#282a36',
    lineBackground: '#282a3699',
    foreground: '#f8f8f2',
    caret: '#f8f8f0',
    selection: 'rgba(255, 255, 255, 0.1)',
    selectionMatch: 'rgba(255, 255, 255, 0.2)',
    gutterBackground: '#282a36',
    gutterForeground: '#6D8A88',
    gutterBorder: 'transparent',
    lineHighlight: 'rgba(255, 255, 255, 0.1)',
  },
  duotoneLight: {
    light: true,
    background: '#faf8f5',
    lineBackground: '#faf8f599',
    foreground: '#b29762',
    caret: '#93abdc',
    selection: '#e3dcce',
    selectionMatch: '#e3dcce',
    gutterBackground: '#faf8f5',
    gutterForeground: '#cdc4b1',
    gutterBorder: 'transparent',
    lineHighlight: '#EFEFEF',
  },
  duotoneDark: {
    background: '#2a2734',
    lineBackground: '#2a273499',
    foreground: '#6c6783',
    caret: '#ffad5c',
    selection: 'rgba(255, 255, 255, 0.1)',
    gutterBackground: '#2a2734',
    gutterForeground: '#545167',
    lineHighlight: '#36334280',
  },
  eclipse: {
    light: true,
    background: '#fff',
    lineBackground: '#ffffff99',
    foreground: '#000',
    caret: '#FFFFFF',
    selection: '#d7d4f0',
    selectionMatch: '#d7d4f0',
    gutterBackground: '#f7f7f7',
    gutterForeground: '#999',
    lineHighlight: '#e8f2ff',
    gutterBorder: 'transparent',
  },
  githubLight: {
    light: true,
    background: '#fff',
    lineBackground: '#ffffff99',
    foreground: '#24292e',
    selection: '#BBDFFF',
    selectionMatch: '#BBDFFF',
    gutterBackground: '#fff',
    gutterForeground: '#6e7781',
  },
  githubDark: {
    background: '#0d1117',
    lineBackground: '#0d111799',
    foreground: '#c9d1d9',
    caret: '#c9d1d9',
    selection: '#003d73',
    selectionMatch: '#003d73',
    lineHighlight: '#36334280',
  },
  gruvboxDark: {
    background: '#282828',
    lineBackground: '#28282899',
    foreground: '#ebdbb2',
    caret: '#ebdbb2',
    selection: '#bdae93',
    selectionMatch: '#bdae93',
    lineHighlight: '#3c3836',
    gutterBackground: '#282828',
    gutterForeground: '#7c6f64',
  },
  gruvboxLight: {
    light: true,
    background: '#fbf1c7',
    lineBackground: '#fbf1c799',
    foreground: '#3c3836',
    caret: '#af3a03',
    selection: '#ebdbb2',
    selectionMatch: '#bdae93',
    lineHighlight: '#ebdbb2',
    gutterBackground: '#ebdbb2',
    gutterForeground: '#665c54',
    gutterBorder: 'transparent',
  },
  materialDark: {
    background: '#2e3235',
    lineBackground: '#2e323599',
    foreground: '#bdbdbd',
    caret: '#a0a4ae',
    selection: '#d7d4f0',
    selectionMatch: '#d7d4f0',
    gutterBackground: '#2e3235',
    gutterForeground: '#999',
    gutterActiveForeground: '#4f5b66',
    lineHighlight: '#545b61',
  },
  materialLight: {
    light: true,
    background: '#FAFAFA',
    lineBackground: '#FAFAFA99',
    foreground: '#90A4AE',
    caret: '#272727',
    selection: '#80CBC440',
    selectionMatch: '#FAFAFA',
    gutterBackground: '#FAFAFA',
    gutterForeground: '#90A4AE',
    gutterBorder: 'transparent',
    lineHighlight: '#CCD7DA50',
  },
  noctisLilac: {
    light: true,
    background: '#f2f1f8',
    lineBackground: '#f2f1f899',
    foreground: '#0c006b',
    caret: '#5c49e9',
    selection: '#d5d1f2',
    selectionMatch: '#d5d1f2',
    gutterBackground: '#f2f1f8',
    gutterForeground: '#0c006b70',
    lineHighlight: '#e1def3',
  },
  nord: {
    background: '#2e3440',
    lineBackground: '#2e344099',
    foreground: '#FFFFFF',
    caret: '#FFFFFF',
    selection: '#3b4252',
    selectionMatch: '#e5e9f0',
    gutterBackground: '#2e3440',
    gutterForeground: '#4c566a',
    gutterActiveForeground: '#d8dee9',
    lineHighlight: '#4c566a',
  },
  okaidia: {
    background: '#272822',
    lineBackground: '#27282299',
    foreground: '#FFFFFF',
    caret: '#FFFFFF',
    selection: '#49483E',
    selectionMatch: '#49483E',
    gutterBackground: '#272822',
    gutterForeground: '#FFFFFF70',
    lineHighlight: '#00000059',
  },
  solarizedLight: {
    light: true,
    background: '#fdf6e3',
    lineBackground: '#fdf6e399',
    foreground: '#657b83',
    caret: '#586e75',
    selection: '#dfd9c8',
    selectionMatch: '#dfd9c8',
    gutterBackground: '#00000010',
    gutterForeground: '#657b83',
    lineHighlight: '#dfd9c8',
  },
  solarizedDark: {
    background: '#002b36',
    lineBackground: '#002b3699',
    foreground: '#93a1a1',
    caret: '#839496',
    selection: '#173541',
    selectionMatch: '#aafe661a',
    gutterBackground: '#00252f',
    gutterForeground: '#839496',
    lineHighlight: '#173541',
  },
  sublime: {
    background: '#303841',
    lineBackground: '#30384199',
    foreground: '#FFFFFF',
    caret: '#FBAC52',
    selection: '#4C5964',
    selectionMatch: '#3A546E',
    gutterBackground: '#303841',
    gutterForeground: '#FFFFFF70',
    lineHighlight: '#00000059',
  },
  tokyoNightDay: {
    light: true,
    background: '#e1e2e7',
    lineBackground: '#e1e2e799',
    foreground: '#3760bf',
    caret: '#3760bf',
    selection: '#99a7df',
    selectionMatch: '#99a7df',
    gutterBackground: '#e1e2e7',
    gutterForeground: '#3760bf',
    gutterBorder: 'transparent',
    lineHighlight: '#5f5faf11',
  },
  tokyoNightStorm: {
    background: '#24283b',
    lineBackground: '#24283b99',
    foreground: '#7982a9',
    caret: '#c0caf5',
    selection: '#6f7bb630',
    selectionMatch: '#1f2335',
    gutterBackground: '#24283b',
    gutterForeground: '#7982a9',
    gutterBorder: 'transparent',
    lineHighlight: '#292e42',
  },
  tokyoNight: {
    background: '#1a1b26',
    lineBackground: '#1a1b2699',
    foreground: '#787c99',
    caret: '#c0caf5',
    selection: '#515c7e40',
    selectionMatch: '#16161e',
    gutterBackground: '#1a1b26',
    gutterForeground: '#787c99',
    gutterBorder: 'transparent',
    lineHighlight: '#1e202e',
  },
  vscodeDark: {
    background: '#1e1e1e',
    lineBackground: '#1e1e1e99',
    foreground: '#9cdcfe',
    caret: '#c6c6c6',
    selection: '#6199ff2f',
    selectionMatch: '#72a1ff59',
    lineHighlight: '#ffffff0f',
    gutterBackground: '#1e1e1e',
    gutterForeground: '#838383',
    gutterActiveForeground: '#fff',
  },
  xcodeLight: {
    light: true,
    background: '#fff',
    lineBackground: '#ffffff99',
    foreground: '#3D3D3D',
    selection: '#BBDFFF',
    selectionMatch: '#BBDFFF',
    gutterBackground: '#fff',
    gutterForeground: '#AFAFAF',
    lineHighlight: '#EDF4FF',
  },
  xcodeDark: {
    background: '#292A30',
    lineBackground: '#292A3099',
    foreground: '#CECFD0',
    caret: '#fff',
    selection: '#727377',
    selectionMatch: '#727377',
    lineHighlight: '#2F3239',
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

// TODO: remove
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

export const theme = (theme) => themes[theme] || themes.strudelTheme;

// css style injection helpers
export function injectStyle(rule) {
  const newStyle = document.createElement('style');
  document.head.appendChild(newStyle);
  const styleSheet = newStyle.sheet;
  const ruleIndex = styleSheet.insertRule(rule, 0);
  return () => styleSheet.deleteRule(ruleIndex);
}

let currentTheme,
  resetThemeStyle,
  themeStyle,
  styleID = 'strudel-theme-vars';
export function initTheme(theme) {
  if (!document.getElementById(styleID)) {
    themeStyle = document.createElement('style');
    themeStyle.id = styleID;
    document.head.append(themeStyle);
  }
  activateTheme(theme);
}

export function activateTheme(name) {
  if (currentTheme === name) {
    return;
  }
  currentTheme = name;
  if (!settings[name]) {
    console.warn('theme', name, 'has no settings.. defaulting to strudelTheme settings');
  }
  const themeSettings = settings[name] || settings.strudelTheme;
  // set css variables
  themeStyle.innerHTML = `:root {
      ${Object.entries(themeSettings)
        // important to override fallback
        .map(([key, value]) => `--${key}: ${value} !important;`)
        .join('\n')}
    }`;
  setTheme(themeSettings);
  // tailwind dark mode
  if (themeSettings.light) {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
  resetThemeStyle?.();
  resetThemeStyle = undefined;
  if (themeSettings.customStyle) {
    resetThemeStyle = injectStyle(themeSettings.customStyle);
  }
}
