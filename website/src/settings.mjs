import { persistentMap } from '@nanostores/persistent';
import { useStore } from '@nanostores/react';
import { register } from '@strudel.cycles/core';
import * as tunes from './repl/tunes.mjs';

export const defaultSettings = {
  activeFooter: 'intro',
  keybindings: 'codemirror',
  isLineNumbersDisplayed: true,
  isAutoCompletionEnabled: false,
  isLineWrappingEnabled: false,
  theme: 'strudelTheme',
  fontFamily: 'monospace',
  fontSize: 18,
  latestCode: '',
  isZen: false,
  soundsFilter: 'all',
  panelPosition: 'bottom',
  userPatterns: '{}',
  activePattern: '',
};

export const settingsMap = persistentMap('strudel-settings', defaultSettings);

export function useSettings() {
  const state = useStore(settingsMap);
  return {
    ...state,
    isZen: [true, 'true'].includes(state.isZen) ? true : false,
    isLineNumbersDisplayed: [true, 'true'].includes(state.isLineNumbersDisplayed) ? true : false,
    isAutoCompletionEnabled: [true, 'true'].includes(state.isAutoCompletionEnabled) ? true : false,
    isLineWrappingEnabled: [true, 'true'].includes(state.isLineWrappingEnabled) ? true : false,
    fontSize: Number(state.fontSize),
    panelPosition: state.activeFooter !== '' ? state.panelPosition : 'bottom',
    userPatterns: JSON.parse(state.userPatterns),
  };
}

export const setActiveFooter = (tab) => settingsMap.setKey('activeFooter', tab);

export const setLatestCode = (code) => settingsMap.setKey('latestCode', code);
export const setIsZen = (active) => settingsMap.setKey('isZen', !!active);

const patternSetting = (key) =>
  register(key, (value, pat) =>
    pat.onTrigger(() => {
      value = Array.isArray(value) ? value.join(' ') : value;
      if (value !== settingsMap.get()[key]) {
        settingsMap.setKey(key, value);
      }
      return pat;
    }, false),
  );

export const theme = patternSetting('theme');
export const fontFamily = patternSetting('fontFamily');
export const fontSize = patternSetting('fontSize');

export const settingPatterns = { theme, fontFamily, fontSize };

function getUserPatterns() {
  return JSON.parse(settingsMap.get().userPatterns);
}
function getSetting(key) {
  return settingsMap.get()[key];
}

function setUserPatterns(obj) {
  settingsMap.setKey('userPatterns', JSON.stringify(obj));
}

export function addUserPattern(name, config) {
  if (typeof config !== 'object') {
    throw new Error('addUserPattern expected object as second param');
  }
  if (!config.code) {
    throw new Error('addUserPattern expected code as property of second param');
  }
  const userPatterns = getUserPatterns();
  setUserPatterns({ ...userPatterns, [name]: config });
}

export function newUserPattern() {
  const userPatterns = getUserPatterns();
  const date = new Date().toISOString().split('T')[0];
  const todays = Object.entries(userPatterns).filter(([name]) => name.startsWith(date));
  const num = String(todays.length + 1).padStart(3, '0');
  const defaultNewPattern = 's("hh")';
  const name = date + '_' + num;
  addUserPattern(name, { code: defaultNewPattern });
  setActivePattern(name);
  return name;
}

export function clearUserPatterns() {
  setUserPatterns({});
}

export function getNextCloneName(key) {
  const userPatterns = getUserPatterns();
  const clones = Object.entries(userPatterns).filter(([name]) => name.startsWith(key));
  const num = String(clones.length + 1).padStart(3, '0');
  return key + '_' + num;
}

export function getUserPattern(key) {
  const userPatterns = getUserPatterns();
  return userPatterns[key];
}

export function updateUserPattern(code) {
  const userPatterns = getUserPatterns();
  let activePattern = getSetting('activePattern');
  console.log('update', activePattern, code);
  if (!activePattern) {
    activePattern = newUserPattern();
    setUserPatterns({ ...userPatterns, [activePattern]: { code } });
    setActivePattern(activePattern);
  } else if (!!tunes[activePattern] && code !== tunes[activePattern]) {
    // is example / system pattern
    activePattern = getNextCloneName(activePattern);
    setUserPatterns({ ...userPatterns, [activePattern]: { code } });
    setActivePattern(activePattern);
  }
}

export function deleteActivePattern() {
  let activePattern = getSetting('activePattern');
  if (!activePattern) {
    console.warn('cannot delete: no pattern selected');
    return;
  }
  const userPatterns = getUserPatterns();
  setUserPatterns(Object.fromEntries(Object.entries(userPatterns).filter(([key]) => key !== activePattern)));
  setActivePattern('');
}

export function duplicateActivePattern() {
  let activePattern = getSetting('activePattern');
  let latestCode = getSetting('latestCode');
  if (!activePattern) {
    console.warn('cannot duplicate: no pattern selected');
    return;
  }
  const userPatterns = getUserPatterns();
  activePattern = getNextCloneName(activePattern);
  setUserPatterns({ ...userPatterns, [activePattern]: { latestCode } });
  setActivePattern(activePattern);
}

export function setActivePattern(key) {
  settingsMap.setKey('activePattern', key);
}
