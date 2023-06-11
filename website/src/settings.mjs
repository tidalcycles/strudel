import { persistentMap } from '@nanostores/persistent';
import { useStore } from '@nanostores/react';

export const defaultSettings = {
  activeFooter: 'intro',
  keybindings: 'codemirror',
  isLineNumbersDisplayed: true,
  theme: 'strudelTheme',
  fontFamily: 'monospace',
  fontSize: 18,
  latestCode: '',
  isZen: false,
  soundsFilter: 'all',
};

export const settingsMap = persistentMap('strudel-settings', defaultSettings);

export function useSettings() {
  const state = useStore(settingsMap);
  return {
    ...state,
    isZen: [true, 'true'].includes(state.isZen) ? true : false,
    isLineNumbersDisplayed: [true, 'true'].includes(state.isLineNumbersDisplayed) ? true : false,
    fontSize: Number(state.fontSize),
  };
}

export const setActiveFooter = (tab) => settingsMap.setKey('activeFooter', tab);

export const setLatestCode = (code) => settingsMap.setKey('latestCode', code);
export const setIsZen = (active) => settingsMap.setKey('isZen', !!active);
