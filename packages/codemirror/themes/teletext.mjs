import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';

let colorA = '#6edee4';
//let colorB = 'magenta';
let colorB = 'white';
let colorC = 'red';
let colorD = '#f8fc55';

export const settings = {
  background: '#000000',
  foreground: colorA, // whats that?
  caret: colorC,
  selection: colorD,
  selectionMatch: colorA,
  lineHighlight: '#6edee440', // panel bg
  lineBackground: '#00000040',
  gutterBackground: 'transparent',
  gutterForeground: '#8a919966',
  // customStyle: '.cm-line { line-height: 1 }',
};

let punctuation = colorD;
let mini = colorB;

export default createTheme({
  theme: 'dark',
  settings,
  styles: [
    { tag: t.labelName, color: colorB },
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
