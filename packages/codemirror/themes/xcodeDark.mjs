import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  background: '#292A30',
  lineBackground: '#292A3099',
  foreground: '#CECFD0',
  caret: '#fff',
  selection: '#727377',
  selectionMatch: '#727377',
  lineHighlight: '#2F3239',
};

export default createTheme({
  theme: 'dark',
  settings: {
    background: '#292A30',
    foreground: '#CECFD0',
    caret: '#fff',
    selection: '#727377',
    selectionMatch: '#727377',
    lineHighlight: '#ffffff0f',
  },
  styles: [
    { tag: [t.comment, t.quote], color: '#7F8C98' },
    { tag: [t.keyword], color: '#FF7AB2', fontWeight: 'bold' },
    { tag: [t.string, t.meta], color: '#FF8170' },
    { tag: [t.typeName], color: '#DABAFF' },
    { tag: [t.definition(t.variableName)], color: '#6BDFFF' },
    { tag: [t.name], color: '#6BAA9F' },
    { tag: [t.variableName], color: '#ACF2E4' },
    { tag: [t.regexp, t.link], color: '#FF8170' },
  ],
});
