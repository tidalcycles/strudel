/**
 * @name gruvbox-dark
 * @author morhetz
 * Name: Gruvbox
 * From github.com/codemirror/codemirror5/blob/master/theme/gruvbox-dark.css
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  background: '#282828',
  lineBackground: '#28282899',
  foreground: '#ebdbb2',
  caret: '#ebdbb2',
  selection: '#bdae93',
  selectionMatch: '#bdae93',
  lineHighlight: '#3c3836',
  gutterBackground: '#282828',
  gutterForeground: '#7c6f64',
};

export default createTheme({
  theme: 'dark',
  settings: {
    background: '#282828',
    foreground: '#ebdbb2',
    caret: '#ebdbb2',
    selection: '#b99d555c',
    selectionMatch: '#b99d555c',
    lineHighlight: '#baa1602b',
    gutterBackground: '#282828',
    gutterForeground: '#7c6f64',
  },
  styles: [
    { tag: t.keyword, color: '#fb4934' },
    { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: '#8ec07c' },
    { tag: [t.variableName], color: '#83a598' },
    { tag: [t.function(t.variableName)], color: '#8ec07c', fontStyle: 'bold' },
    { tag: [t.labelName], color: '#ebdbb2' },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#d3869b' },
    { tag: [t.definition(t.name), t.separator], color: '#ebdbb2' },
    { tag: [t.brace], color: '#ebdbb2' },
    { tag: [t.annotation], color: '#fb4934d' },
    { tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#d3869b' },
    { tag: [t.typeName, t.className], color: '#fabd2f' },
    { tag: [t.operatorKeyword], color: '#fb4934' },
    {
      tag: [t.tagName],
      color: '#8ec07c',
      fontStyle: 'bold',
    },
    { tag: [t.squareBracket], color: '#fe8019' },
    { tag: [t.angleBracket], color: '#83a598' },
    { tag: [t.attributeName], color: '#8ec07c' },
    { tag: [t.regexp], color: '#8ec07c' },
    { tag: [t.quote], color: '#928374' },
    { tag: [t.string], color: '#ebdbb2' },
    {
      tag: t.link,
      color: '#a89984',
      textDecoration: 'underline',
      textUnderlinePosition: 'under',
    },
    { tag: [t.url, t.escape, t.special(t.string)], color: '#d3869b' },
    { tag: [t.meta], color: '#fabd2f' },
    { tag: [t.comment], color: '#928374', fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold', color: '#fe8019' },
    { tag: t.emphasis, fontStyle: 'italic', color: '#b8bb26' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.heading, fontWeight: 'bold', color: '#b8bb26' },
    { tag: [t.heading1, t.heading2], fontWeight: 'bold', color: '#b8bb26' },
    {
      tag: [t.heading3, t.heading4],
      fontWeight: 'bold',
      color: '#fabd2f',
    },
    { tag: [t.heading5, t.heading6], color: '#fabd2f' },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#d3869b' },
    { tag: [t.processingInstruction, t.inserted], color: '#83a598' },
    { tag: [t.contentSeparator], color: '#fb4934' },
    { tag: t.invalid, color: '#fe8019', borderBottom: `1px dotted #fb4934d` },
  ],
});
