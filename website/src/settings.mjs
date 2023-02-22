import { persistentMap } from '@nanostores/persistent';
import { useStore } from '@nanostores/react';

export const defaultSettings = {
  keybindings: 'codemirror',
  theme: 'strudelTheme',
  fontFamily: 'monospace',
  fontSize: 18,
};

export const settingsMap = persistentMap('strudel-settings', defaultSettings);

export function useSettings() {
  return useStore(settingsMap);
}
