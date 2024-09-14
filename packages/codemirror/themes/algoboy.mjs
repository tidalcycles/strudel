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
    { tag: t.labelName, color: '#0f380f' },
    { tag: t.keyword, color: '#0f380f' },
    { tag: t.operator, color: '#0f380f' },
    { tag: t.special(t.variableName), color: '#0f380f' },
    { tag: t.typeName, color: '#0f380f' },
    { tag: t.atom, color: '#0f380f' },
    { tag: t.number, color: '#0f380f' },
    { tag: t.definition(t.variableName), color: '#0f380f' },
    { tag: t.string, color: '#0f380f' },
    { tag: t.special(t.string), color: '#0f380f' },
    { tag: t.comment, color: '#0f380f' },
    { tag: t.variableName, color: '#0f380f' },
    { tag: t.tagName, color: '#0f380f' },
    { tag: t.bracket, color: '#0f380f' },
    { tag: t.meta, color: '#0f380f' },
    { tag: t.attributeName, color: '#0f380f' },
    { tag: t.propertyName, color: '#0f380f' },
    { tag: t.className, color: '#0f380f' },
    { tag: t.invalid, color: '#0f380f' },
    { tag: [t.unit, t.punctuation], color: '#0f380f' },
  ],
});
