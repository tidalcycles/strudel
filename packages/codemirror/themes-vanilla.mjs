import strudelTheme from './themes/strudel-theme-vanilla.mjs';
import { setTheme } from '@strudel/draw';

export const themes = {
  strudelTheme,
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
