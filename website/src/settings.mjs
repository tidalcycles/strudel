import { atom } from 'nanostores';
import { persistentMap, persistentAtom } from '@nanostores/persistent';
import { useStore } from '@nanostores/react';
import { register } from '@strudel/core';
import * as tunes from './repl/tunes.mjs';
import { logger } from '@strudel/core';

export let $publicPatterns = atom([]);
export let $featuredPatterns = atom([]);

export const defaultAudioDeviceName = 'System Standard';

export const defaultSettings = {
  activeFooter: 'intro',
  keybindings: 'codemirror',
  isLineNumbersDisplayed: true,
  isActiveLineHighlighted: true,
  isAutoCompletionEnabled: false,
  isTooltipEnabled: false,
  isFlashEnabled: true,
  isLineWrappingEnabled: false,
  isPatternHighlightingEnabled: true,
  theme: 'strudelTheme',
  fontFamily: 'monospace',
  fontSize: 18,
  latestCode: '',
  isZen: false,
  soundsFilter: 'all',
  panelPosition: 'right',
  userPatterns: '{}',
  audioDeviceName: defaultAudioDeviceName,
};

export const settingsMap = persistentMap('strudel-settings', defaultSettings);

// active pattern is separate, because it shouldn't sync state across tabs
// reason: https://github.com/tidalcycles/strudel/issues/857
const $activePattern = persistentAtom('activePattern', '', { listen: false });
export function setActivePattern(key) {
  $activePattern.set(key);
}
export function getActivePattern() {
  return $activePattern.get();
}
export function useActivePattern() {
  return useStore($activePattern);
}
export function initUserCode(code) {
  const userPatterns = getUserPatterns();
  const match = Object.entries(userPatterns).find(([_, pat]) => pat.code === code);
  setActivePattern(match?.[0] || '');
}

export function useSettings() {
  const state = useStore(settingsMap);
  return {
    ...state,
    isZen: [true, 'true'].includes(state.isZen) ? true : false,
    isLineNumbersDisplayed: [true, 'true'].includes(state.isLineNumbersDisplayed) ? true : false,
    isActiveLineHighlighted: [true, 'true'].includes(state.isActiveLineHighlighted) ? true : false,
    isAutoCompletionEnabled: [true, 'true'].includes(state.isAutoCompletionEnabled) ? true : false,
    isPatternHighlightingEnabled: [true, 'true'].includes(state.isPatternHighlightingEnabled) ? true : false,
    isTooltipEnabled: [true, 'true'].includes(state.isTooltipEnabled) ? true : false,
    isLineWrappingEnabled: [true, 'true'].includes(state.isLineWrappingEnabled) ? true : false,
    isFlashEnabled: [true, 'true'].includes(state.isFlashEnabled) ? true : false,
    fontSize: Number(state.fontSize),
    panelPosition: state.activeFooter !== '' ? state.panelPosition : 'bottom', // <-- keep this 'bottom' where it is!
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

export function getUserPatterns() {
  return JSON.parse(settingsMap.get().userPatterns);
}
function getSetting(key) {
  return settingsMap.get()[key];
}

export function setUserPatterns(obj) {
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
  if (!confirm(`This will delete all your patterns. Are you really sure?`)) {
    return;
  }
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

export function renameActivePattern() {
  let activePattern = getActivePattern();
  let userPatterns = getUserPatterns();
  if (!userPatterns[activePattern]) {
    alert('Cannot rename examples');
    return;
  }
  const newName = prompt('Enter new name', activePattern);
  if (newName === null) {
    // canceled
    return;
  }
  if (userPatterns[newName]) {
    alert('Name already taken!');
    return;
  }
  userPatterns[newName] = userPatterns[activePattern]; // copy code
  delete userPatterns[activePattern];
  setUserPatterns({ ...userPatterns });
  setActivePattern(newName);
}

export function updateUserCode(code) {
  const userPatterns = getUserPatterns();
  let activePattern = getActivePattern();
  // check if code is that of an example tune
  const [example] = Object.entries(tunes).find(([_, tune]) => tune === code) || [];
  if (example && (!activePattern || activePattern === example)) {
    // select example
    setActivePattern(example);
    return;
  }
  const publicPattern = $publicPatterns.get().find((pat) => pat.code === code);
  if (publicPattern) {
    setActivePattern(publicPattern.hash);
    return;
  }
  const featuredPattern = $featuredPatterns.get().find((pat) => pat.code === code);
  if (featuredPattern) {
    setActivePattern(featuredPattern.hash);
    return;
  }
  if (!activePattern) {
    // create new user pattern
    activePattern = newUserPattern();
    setActivePattern(activePattern);
  } else if (
    (!!tunes[activePattern] && code !== tunes[activePattern]) || // fork example tune?
    $publicPatterns.get().find((p) => p.hash === activePattern) || // fork public pattern?
    $featuredPatterns.get().find((p) => p.hash === activePattern) // fork featured pattern?
  ) {
    // fork example
    activePattern = getNextCloneName(activePattern);
    setActivePattern(activePattern);
  }
  setUserPatterns({ ...userPatterns, [activePattern]: { code } });
}

export function deleteActivePattern() {
  let activePattern = getActivePattern();
  if (!activePattern) {
    console.warn('cannot delete: no pattern selected');
    return;
  }
  const userPatterns = getUserPatterns();
  if (!userPatterns[activePattern]) {
    alert('Cannot delete examples');
    return;
  }
  if (!confirm(`Really delete the selected pattern "${activePattern}"?`)) {
    return;
  }
  setUserPatterns(Object.fromEntries(Object.entries(userPatterns).filter(([key]) => key !== activePattern)));
  setActivePattern('');
}

export function duplicateActivePattern() {
  let activePattern = getActivePattern();
  let latestCode = getSetting('latestCode');
  if (!activePattern) {
    console.warn('cannot duplicate: no pattern selected');
    return;
  }
  const userPatterns = getUserPatterns();
  activePattern = getNextCloneName(activePattern);
  setUserPatterns({ ...userPatterns, [activePattern]: { code: latestCode } });
  setActivePattern(activePattern);
}

export async function importPatterns(fileList) {
  const files = Array.from(fileList);
  await Promise.all(
    files.map(async (file, i) => {
      const content = await file.text();
      if (file.type === 'application/json') {
        const userPatterns = getUserPatterns() || {};
        setUserPatterns({ ...userPatterns, ...JSON.parse(content) });
      } else if (file.type === 'text/plain') {
        const name = file.name.replace(/\.[^/.]+$/, '');
        addUserPattern(name, { code: content });
      }
    }),
  );
  logger(`import done!`);
}

export async function exportPatterns() {
  const userPatterns = getUserPatterns() || {};
  const blob = new Blob([JSON.stringify(userPatterns)], { type: 'application/json' });
  const downloadLink = document.createElement('a');
  downloadLink.href = window.URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  downloadLink.download = `strudel_patterns_${date}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
