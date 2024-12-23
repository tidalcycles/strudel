import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
export const settings = {
  background: '#9bbc0f',
  foreground: '#0f380f', // whats that?
  caret: '#0f380f',
  selection: '#306230',
  selectionMatch: '#ffffff26',
  lineHighlight: '#8bac0f',
  lineBackground: '#9bbc0f50',
  //lineBackground: 'transparent',
  gutterBackground: 'transparent',
  gutterForeground: '#0f380f',
  light: true,
  // customStyle: '.cm-line { line-height: 1 }',
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
    { tag: [t.unit, t.punctuation], color: 'inherit' },
  ],
});
