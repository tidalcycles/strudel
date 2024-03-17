import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
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
    { tag: t.labelName, color: '#41FF00' },
    { tag: t.keyword, color: '#41FF00' },
    { tag: t.operator, color: '#41FF00' },
    { tag: t.special(t.variableName), color: '#41FF00' },
    { tag: t.typeName, color: '#41FF00' },
    { tag: t.atom, color: '#41FF00' },
    { tag: t.number, color: '#41FF00' },
    { tag: t.definition(t.variableName), color: '#41FF00' },
    { tag: t.string, color: '#41FF00' },
    { tag: t.special(t.string), color: '#41FF00' },
    { tag: t.comment, color: '#41FF00' },
    { tag: t.variableName, color: '#41FF00' },
    { tag: t.tagName, color: '#41FF00' },
    { tag: t.bracket, color: '#41FF00' },
    { tag: t.meta, color: '#41FF00' },
    { tag: t.attributeName, color: '#41FF00' },
    { tag: t.propertyName, color: '#41FF00' },
    { tag: t.className, color: '#41FF00' },
    { tag: t.invalid, color: '#41FF00' },
  ],
});
