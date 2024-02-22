import { persistentMap } from '@nanostores/persistent';
import { useStore } from '@nanostores/react';
import { register } from '@strudel/core';

export const defaultAudioDeviceName = 'System Standard';

export const defaultSettings = {
  activeFooter: 'intro',
  keybindings: 'codemirror',
  isBracketMatchingEnabled: false,
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
  patternFilter: 'community',
  panelPosition: 'right',
  userPatterns: '{}',
  audioDeviceName: defaultAudioDeviceName,
};

export const settingsMap = persistentMap('strudel-settings', defaultSettings);

export function useSettings() {
  const state = useStore(settingsMap);

  const userPatterns = JSON.parse(state.userPatterns);
  Object.keys(userPatterns).forEach((key) => {
    const data = userPatterns[key];
    data.id = data.id ?? key;
    userPatterns[key] = data;
  });
  return {
    ...state,
    isZen: [true, 'true'].includes(state.isZen) ? true : false,
    isBracketMatchingEnabled: [true, 'true'].includes(state.isBracketMatchingEnabled) ? true : false,
    isLineNumbersDisplayed: [true, 'true'].includes(state.isLineNumbersDisplayed) ? true : false,
    isActiveLineHighlighted: [true, 'true'].includes(state.isActiveLineHighlighted) ? true : false,
    isAutoCompletionEnabled: [true, 'true'].includes(state.isAutoCompletionEnabled) ? true : false,
    isPatternHighlightingEnabled: [true, 'true'].includes(state.isPatternHighlightingEnabled) ? true : false,
    isTooltipEnabled: [true, 'true'].includes(state.isTooltipEnabled) ? true : false,
    isLineWrappingEnabled: [true, 'true'].includes(state.isLineWrappingEnabled) ? true : false,
    isFlashEnabled: [true, 'true'].includes(state.isFlashEnabled) ? true : false,
    fontSize: Number(state.fontSize),
    panelPosition: state.activeFooter !== '' ? state.panelPosition : 'bottom', // <-- keep this 'bottom' where it is!
    userPatterns: userPatterns,
  };
}

export const setActiveFooter = (tab) => settingsMap.setKey('activeFooter', tab);

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
