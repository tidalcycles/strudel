import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

// this is slightly different from https://thememirror.net/solarized-light

export const settings = {
  light: true,
  background: '#fdf6e3',
  lineBackground: '#fdf6e399',
  foreground: '#657b83',
  caret: '#586e75',
  selection: '#dfd9c8',
  selectionMatch: '#dfd9c8',
  gutterBackground: '#00000010',
  gutterForeground: '#657b83',
  lineHighlight: '#dfd9c8',
};

const c = {
  background: '#FDF6E3',
  foreground: '#657B83',
  selection: '#EEE8D5',
  selectionMatch: '#EEE8D5',
  cursor: '#657B83',
  dropdownBackground: '#EEE8D5',
  dropdownBorder: '#D3AF86',
  activeLine: '#3d392d11',
  matchingBracket: '#EEE8D5',
  keyword: '#859900',
  storage: '#586E75',
  variable: '#268BD2',
  parameter: '#268BD2',
  function: '#268BD2',
  string: '#2AA198',
  constant: '#CB4B16',
  type: '#859900',
  class: '#268BD2',
  number: '#D33682',
  comment: '#93A1A1',
  heading: '#268BD2',
  invalid: '#DC322F',
  regexp: '#DC322F',
  tag: '#268BD2',
};

export default createTheme({
  theme: 'light',
  settings: {
    background: c.background,
    foreground: c.foreground,
    caret: c.cursor,
    selection: c.selection,
    selectionMatch: c.selectionMatch,
    gutterBackground: c.background,
    gutterForeground: c.foreground,
    gutterBorder: 'transparent',
    lineHighlight: c.activeLine,
  },
  styles: [
    { tag: t.keyword, color: c.keyword },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: c.variable },
    { tag: [t.propertyName], color: c.function },
    { tag: [t.processingInstruction, t.string, t.inserted, t.special(t.string)], color: c.string },
    { tag: [t.function(t.variableName), t.labelName], color: c.function },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: c.constant },
    { tag: [t.definition(t.name), t.separator], color: c.variable },
    { tag: [t.className], color: c.class },
    { tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: c.number },
    { tag: [t.typeName], color: c.type, fontStyle: c.type },
    { tag: [t.operator, t.operatorKeyword], color: c.keyword },
    { tag: [t.url, t.escape, t.regexp, t.link], color: c.regexp },
    { tag: [t.meta, t.comment], color: c.comment },
    { tag: t.tagName, color: c.tag },
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.link, textDecoration: 'underline' },
    { tag: t.heading, fontWeight: 'bold', color: c.heading },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: c.variable },
    { tag: t.invalid, color: c.invalid },
    { tag: t.strikethrough, textDecoration: 'line-through' },
  ],
});
