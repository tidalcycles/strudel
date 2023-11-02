// import 'tailwindcss/tailwind.css';

export { default as CodeMirror, flash, updateMiniLocations, highlightMiniLocations } from './components/CodeMirror6'; // !SSR
export * from './components/MiniRepl'; // !SSR
export { default as useHighlighting } from './hooks/useHighlighting'; // !SSR
export { default as useStrudel } from './hooks/useStrudel'; // !SSR
export { default as usePostMessage } from './hooks/usePostMessage';
export { default as usePatternFrame } from './hooks/usePatternFrame';
export { default as useKeydown } from './hooks/useKeydown';
export { useWidgets } from './hooks/useWidgets';
export { default as useEvent } from './hooks/useEvent';
export { default as strudelTheme } from './themes/strudel-theme';
export { default as teletext } from './themes/teletext';
export { default as cx } from './cx';
