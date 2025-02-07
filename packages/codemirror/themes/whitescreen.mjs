import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';
export const settings = {
  background: 'white',
  foreground: 'black', // whats that?
  caret: 'black',
  selection: 'rgba(128, 203, 196, 0.5)',
  selectionMatch: '#ffffff26',
  lineHighlight: '#cccccc50',
  lineBackground: '#ffffff50',
  gutterBackground: 'transparent',
  gutterForeground: 'black',
  light: true,
};
export default createTheme({
  theme: 'light',
  settings,
  styles: [
    { tag: t.labelName, color: 'inherit' },
    { tag: t.keyword, color: 'inherit' },
    { tag: t.operator, color: 'inherit' },
    { tag: t.special(t.variableName), color: 'inherit' },
    { tag: t.typeName, color: 'inherit' },
    { tag: t.atom, color: 'inherit' },
    { tag: t.number, color: 'inherit' },
    { tag: t.definition(t.variableName), color: 'inherit' },
    { tag: t.string, color: 'inherit' },
    { tag: t.special(t.string), color: 'inherit' },
    { tag: t.comment, color: 'inherit' },
    { tag: t.variableName, color: 'inherit' },
    { tag: t.tagName, color: 'inherit' },
    { tag: t.bracket, color: 'inherit' },
    { tag: t.meta, color: 'inherit' },
    { tag: t.attributeName, color: 'inherit' },
    { tag: t.propertyName, color: 'inherit' },
    { tag: t.className, color: 'inherit' },
    { tag: t.invalid, color: 'inherit' },
  ],
});
