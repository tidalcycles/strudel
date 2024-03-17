import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
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
    { tag: t.labelName, color: 'black' },
    { tag: t.keyword, color: 'black' },
    { tag: t.operator, color: 'black' },
    { tag: t.special(t.variableName), color: 'black' },
    { tag: t.typeName, color: 'black' },
    { tag: t.atom, color: 'black' },
    { tag: t.number, color: 'black' },
    { tag: t.definition(t.variableName), color: 'black' },
    { tag: t.string, color: 'black' },
    { tag: t.special(t.string), color: 'black' },
    { tag: t.comment, color: 'black' },
    { tag: t.variableName, color: 'black' },
    { tag: t.tagName, color: 'black' },
    { tag: t.bracket, color: 'black' },
    { tag: t.meta, color: 'black' },
    { tag: t.attributeName, color: 'black' },
    { tag: t.propertyName, color: 'black' },
    { tag: t.className, color: 'black' },
    { tag: t.invalid, color: 'black' },
  ],
});
