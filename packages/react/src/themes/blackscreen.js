import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
export const settings = {
  background: 'black',
  foreground: '#dddddd', // whats that?
  caret: '#dddddd',
  selection: '#ffffff20',
  selectionMatch: '#036dd626',
  lineHighlight: '#ffffff10',
  gutterBackground: 'transparent',
  gutterForeground: '#8a919966',
  fontFamily: 'BigBlueTerminal, monospace',
  //fontFamily: 'x3270, monospace',
};
export default createTheme({
  theme: 'dark',
  settings,
  styles: [
    { tag: t.keyword, color: '#dddddd' },
    { tag: t.operator, color: '#dddddd' },
    { tag: t.special(t.variableName), color: '#dddddd' },
    { tag: t.typeName, color: '#dddddd' },
    { tag: t.atom, color: '#dddddd' },
    { tag: t.number, color: '#dddddd' },
    { tag: t.definition(t.variableName), color: '#dddddd' },
    { tag: t.string, color: '#dddddd' },
    { tag: t.special(t.string), color: '#dddddd' },
    { tag: t.comment, color: '#dddddd' },
    { tag: t.variableName, color: '#dddddd' },
    { tag: t.tagName, color: '#dddddd' },
    { tag: t.bracket, color: '#dddddd' },
    { tag: t.meta, color: '#dddddd' },
    { tag: t.attributeName, color: '#dddddd' },
    { tag: t.propertyName, color: '#dddddd' },
    { tag: t.className, color: '#dddddd' },
    { tag: t.invalid, color: '#dddddd' },
  ],
});
