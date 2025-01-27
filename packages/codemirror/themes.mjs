import strudelTheme, { settings as strudelThemeSettings } from './themes/strudel-theme.mjs';
import bluescreen, { settings as bluescreenSettings } from './themes/bluescreen.mjs';
import blackscreen, { settings as blackscreenSettings } from './themes/blackscreen.mjs';
import whitescreen, { settings as whitescreenSettings } from './themes/whitescreen.mjs';
import teletext, { settings as teletextSettings } from './themes/teletext.mjs';
import algoboy, { settings as algoboySettings } from './themes/algoboy.mjs';
import terminal, { settings as terminalSettings } from './themes/terminal.mjs';
import abcdef, { settings as abcdefSettings } from './themes/abcdef.mjs';
import androidstudio, { settings as androidstudioSettings } from './themes/androidstudio.mjs';
import atomone, { settings as atomOneSettings } from './themes/atomone.mjs';
import aura, { settings as auraSettings } from './themes/aura.mjs';
import bespin, { settings as bespinSettings } from './themes/bespin.mjs';
import darcula, { settings as darculaSettings } from './themes/darcula.mjs';
import dracula, { settings as draculaSettings } from './themes/dracula.mjs';
import duotoneDark, { settings as duotoneDarkSettings } from './themes/duotoneDark.mjs';
import duotoneLight, { settings as duotoneLightSettings } from './themes/duotoneLight.mjs';
import eclipse, { settings as eclipseSettings } from './themes/eclipse.mjs';
import githubDark, { settings as githubDarkSettings } from './themes/githubDark.mjs';
import githubLight, { settings as githubLightSettings } from './themes/githubLight.mjs';
import gruvboxDark, { settings as gruvboxDarkSettings } from './themes/gruvboxDark.mjs';
import gruvboxLight, { settings as gruvboxLightSettings } from './themes/gruvboxLight.mjs';
import materialDark, { settings as materialDarkSettings } from './themes/materialDark.mjs';
import materialLight, { settings as materialLightSettings } from './themes/materialLight.mjs';

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
  duotoneLight,
  eclipse,
  githubDark,
  gruvboxDark,
  materialDark,
  /*nord,
  okaidia,
  solarizedDark,
  sublime,
  tokyoNight,
  tokyoNightStorm,
  vscodeDark,
  xcodeDark,*/
  /*bbedit,*/
  githubLight,
  gruvboxLight,
  materialLight /*
  noctisLilac,
  solarizedLight,
  tokyoNightDay,
  xcodeLight, */,
};

// lineBackground is background with 50% opacity, to make sure the selection below is visible

export const settings = {
  strudelTheme: strudelThemeSettings,
  bluescreen: bluescreenSettings,
  blackscreen: blackscreenSettings,
  whitescreen: whitescreenSettings,
  teletext: teletextSettings,
  algoboy: algoboySettings,
  terminal: terminalSettings,
  abcdef: abcdefSettings,
  androidstudio: androidstudioSettings,
  atomone: atomOneSettings,
  aura: auraSettings,
  /*bbedit: {
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
  },*/
  bespin: bespinSettings,
  darcula: darculaSettings,
  dracula: draculaSettings,
  duotoneLight: duotoneLightSettings,
  duotoneDark: duotoneDarkSettings,
  eclipse: eclipseSettings,
  githubLight: githubLightSettings,
  githubDark: githubDarkSettings,

  gruvboxDark: gruvboxDarkSettings,
  gruvboxLight: gruvboxLightSettings,

  materialDark: materialDarkSettings,
  materialLight: materialLightSettings,
  /*noctisLilac: {
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
  }, */
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
