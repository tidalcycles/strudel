import { persistentMap } from '@nanostores/persistent';
import { useStore } from '@nanostores/react';

export const defaultSettings = {
  activeFooter: 'intro',
  keybindings: 'codemirror',
  theme: 'strudelTheme',
  fontFamily: 'monospace',
  fontSize: 18,
  latestCode: '',
};

export const settingsMap = persistentMap('strudel-settings', defaultSettings);

export function useSettings() {
  return useStore(settingsMap);
}

export const setActiveFooter = (tab) => settingsMap.setKey('activeFooter', tab);

export const setLatestCode = (code) => settingsMap.setKey('latestCode', code);
