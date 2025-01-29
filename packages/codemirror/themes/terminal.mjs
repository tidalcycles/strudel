import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';
export const settings = {
  background: 'black',
  foreground: '#41FF00', // whats that?
  caret: '#41FF00',
  selection: '#ffffff20',
  selectionMatch: '#036dd626',
  lineHighlight: '#ffffff10',
  gutterBackground: 'transparent',
  gutterForeground: '#8a919966',
};
export default createTheme({
  theme: 'dark',
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
