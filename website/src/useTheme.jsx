import { useState } from 'react';
import { settings } from './repl/themes.mjs';
import { useEffect } from 'react';

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem('strudel-theme'));
  useEvent('strudel-theme', (e) => setTheme(e.detail));
  const themeSettings = settings[theme || 'strudelTheme'];
  return {
    theme,
    setTheme,
    settings: themeSettings,
    isDark: !themeSettings.light,
    isLight: !!themeSettings.light,
  };
}
// TODO: dedupe
function useEvent(name, onTrigger, useCapture = false) {
  useEffect(() => {
    document.addEventListener(name, onTrigger, useCapture);
    return () => {
      document.removeEventListener(name, onTrigger, useCapture);
    };
  }, [onTrigger]);
}

export default useTheme;
