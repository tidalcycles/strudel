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
import nord, { settings as nordSettings } from './themes/nord.mjs';
import monokai, { settings as monokaiSettings } from './themes/monokai.mjs';
import solarizedDark, { settings as solarizedDarkSettings } from './themes/solarizedDark.mjs';
import solarizedLight, { settings as solarizedLightSettings } from './themes/solarizedLight.mjs';
import sublime, { settings as sublimeSettings } from './themes/sublime.mjs';
import tokyoNight, { settings as tokyoNightSettings } from './themes/tokyoNight.mjs';
import tokyoNightStorm, { settings as tokyoNightStormSettings } from './themes/tokioNightStorm.mjs';
import tokyoNightDay, { settings as tokyoNightDaySettings } from './themes/tokyoNightDay.mjs';
import vscodeDark, { settings as vscodeDarkSettings } from './themes/vscodeDark.mjs';
import vscodeLight, { settings as vscodeLightSettings } from './themes/vscodeLight.mjs';
// import xcodeDark, { settings as xcodeDarkSettings } from './themes/xcodeDark.mjs';
import xcodeLight, { settings as xcodeLightSettings } from './themes/xcodeLight.mjs';
import bbedit, { settings as bbeditSettings } from './themes/bbedit.mjs';
import noctisLilac, { settings as noctisLilacSettings } from './themes/noctisLilac.mjs';

import { setTheme } from '@strudel/draw';

export const themes = {
  strudelTheme,
  bluescreen,
  blackscreen,
  whitescreen,
  teletext,
  algoboy,
  atomone,
  aura,
  darcula,
  dracula,
  // todo: optimize
  // bespin,
  //abcdef,
  androidstudio,
  duotoneDark,
  githubDark,
  gruvboxDark,
  materialDark,
  nord,
  monokai,
  solarizedDark,
  sublime,
  tokyoNight,
  tokyoNightStorm,
  vscodeDark,
  //xcodeDark,
  // LIGHT
  bbedit,
  //duotoneLight,
  eclipse,
  githubLight,
  gruvboxLight,
  materialLight,
  vscodeLight,
  noctisLilac,
  solarizedLight,
  tokyoNightDay,
  xcodeLight,
};

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
  bbedit: bbeditSettings,
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
  noctisLilac: noctisLilacSettings,
  nord: nordSettings,
  monokai: monokaiSettings,
  solarizedLight: solarizedLightSettings,
  solarizedDark: solarizedDarkSettings,
  sublime: sublimeSettings,
  tokyoNight: tokyoNightSettings,
  tokyoNightStorm: tokyoNightStormSettings,
  vscodeDark: vscodeDarkSettings,
  vscodeLight: vscodeLightSettings,
  xcodeLight: xcodeLightSettings,
  //xcodeDark: xcodeDarkSettings,
  tokyoNightDay: tokyoNightDaySettings,
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
