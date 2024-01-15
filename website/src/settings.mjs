import { atom } from 'nanostores';
import { persistentMap, persistentAtom } from '@nanostores/persistent';
import { useStore } from '@nanostores/react';
import { register } from '@strudel.cycles/core';
import * as tunes from './repl/tunes.mjs';
import { logger } from '@strudel.cycles/core';

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

const defaultCode = '';
//pattern that the use is currently viewing in the window
const $viewingPattern = persistentAtom('viewingPattern', '', { listen: false });
export function setViewingPattern(key) {
  $viewingPattern.set(key);
}
export function getViewingPattern() {
  return $viewingPattern.get();
}

export function useViewingPattern() {
  return useStore($viewingPattern);
}
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
  const patterns = { ...userPattern.getAll(), ...examplePattern.getAll() };
  const match = Object.entries(patterns).find(([_, pat]) => pat.code === code);
  const id = match?.[0];
  if (id != null) {
    setActivePattern(id);
    setViewingPattern(id);
  }
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
  return settingsMap.setKey('userPatterns', JSON.stringify(obj));
}

export const createPatternID = () => {
  const userPatterns = getUserPatterns();
  const date = new Date().toISOString().split('T')[0];
  const todays = Object.entries(userPatterns).filter(([name]) => name.startsWith(date));
  const num = String(todays.length + 1).padStart(3, '0');
  const id = date + '_' + num;
  return id;
};

export const getNextCloneID = (id) => {
  const patterns = { ...userPattern.getAll(), ...examplePattern.getAll() };
  const clones = Object.entries(patterns).filter(([patID]) => patID.startsWith(id));
  const num = String(clones.length + 1).padStart(3, '0');
  const newID = id + '_' + num;
  return newID;
};

const examplePatterns = Object.fromEntries(Object.entries(tunes).map(([id, code]) => [id, { code }]));

export const examplePattern = {
  getAll() {
    return examplePatterns;
  },
  getPatternData(id) {
    const pats = this.getAll();
    return pats[id];
  },
  exists(id) {
    return this.getPatternData(id) != null;
  },
};

// break
export const userPattern = {
  getAll() {
    return JSON.parse(settingsMap.get().userPatterns);
  },
  getPatternData(id) {
    const userPatterns = this.getAll();
    return userPatterns[id];
  },
  exists(id) {
    return this.getPatternData(id) != null;
  },
  create() {
    const newID = createPatternID();
    const code = defaultCode;
    const data = { code };
    this.update(newID, data);
    return { id: newID, data };
  },
  update(id, data) {
    const userPatterns = this.getAll();
    setUserPatterns({ ...userPatterns, [id]: data });
  },
  duplicate(id) {
    const examplePatternData = examplePattern.getPatternData(id);
    const data = examplePatternData != null ? examplePatternData : this.getPatternData(id);
    const newID = getNextCloneID(id);
    this.update(newID, data);
    return { id: newID, data };
  },
  clearAll() {
    if (!confirm(`This will delete all your patterns. Are you really sure?`)) {
      return;
    }
    const viewingPattern = getViewingPattern();
    const examplePatternData = examplePattern.getPatternData(viewingPattern);
    setUserPatterns({});
    if (examplePatternData != null) {
      return { id: viewingPattern, data: examplePatternData };
    }
    // setViewingPattern(null);
    setActivePattern(null);
    return { id: null, data: { code: defaultCode } };
  },
  delete(id) {
    const userPatterns = this.getAll();
    delete userPatterns[id];
    if (getActivePattern() === id) {
      setActivePattern(null);
    }
    setUserPatterns(userPatterns);
    const viewingPattern = getViewingPattern();
    if (viewingPattern === id) {
      return { id: null, data: { code: defaultCode } };
    }
    return { id: viewingPattern, data: userPatterns[viewingPattern] };
  },

  rename(id) {
    const userPatterns = this.getAll();
    const newID = prompt('Enter new name', id);
    const data = userPatterns[id];
    if (newID === null) {
      // canceled
      return { id, data };
    }
    if (userPatterns[newID]) {
      alert('Name already taken!');
      return { id, data };
    }
// break
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
// break

    userPatterns[newID] = data; // copy code
    delete userPatterns[id];

    setUserPatterns({ ...userPatterns });
    if (id === getActivePattern()) {
      setActivePattern(newID);
    }
    return { id: newID, data };
  },
};

export async function importPatterns(fileList) {
  const files = Array.from(fileList);
  await Promise.all(
    files.map(async (file, i) => {
      const content = await file.text();
      if (file.type === 'application/json') {
        const userPatterns = getUserPatterns() || {};
        setUserPatterns({ ...userPatterns, ...JSON.parse(content) });
      } else if (file.type === 'text/plain') {
        const id = file.name.replace(/\.[^/.]+$/, '');
        userPattern.update(id, { code: content });
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
