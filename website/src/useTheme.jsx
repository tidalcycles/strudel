import { settings } from './repl/themes.mjs';
import useStore from './useStore.mjs';

function useTheme() {
  const { state } = useStore();
  const theme = state.theme || 'strudelTheme';
  const themeSettings = settings[theme];
  return {
    theme: state.theme,
    themeSettings,
  };
}

export default useTheme;
