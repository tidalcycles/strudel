import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';

let colorA = '#3f51e6';
let colorB = '#f9db4a';
let colorC = '#9f2822';
let colorD = '#959595';

export const settings = {
  background: '#00000f',
  foreground: colorB, // whats that?
  caret: colorC,
  selection: colorD,
  selectionMatch: colorA,
  lineHighlight: '#22222280', // panel bg
  lineBackground: '#00000090',
  gutterBackground: 'transparent',
  gutterForeground: '#8a919966',
};

//let punctuation = colorA;
let keywords = colorB;
let punctuation = colorD;
let mini = colorB;

export default createTheme({
  theme: 'dark',
  settings,
  styles: [
    { tag: t.keyword, color: colorA },
    { tag: t.operator, color: mini },
    { tag: t.special(t.variableName), color: colorA },
    { tag: t.typeName, color: colorA },
    { tag: t.atom, color: colorA },
    { tag: t.number, color: mini },
    { tag: t.definition(t.variableName), color: colorA },
    { tag: t.string, color: mini },
    { tag: t.special(t.string), color: mini },
    { tag: t.comment, color: punctuation },
    { tag: t.variableName, color: colorA },
    { tag: t.tagName, color: colorA },
    { tag: t.bracket, color: punctuation },
    { tag: t.meta, color: colorA },
    { tag: t.attributeName, color: colorA },
    { tag: t.propertyName, color: colorA }, // methods
    { tag: t.className, color: colorA },
    { tag: t.invalid, color: colorC },
    { tag: [t.unit, t.punctuation], color: punctuation },
  ],
});
