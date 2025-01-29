/**
 * @name gruvbox-light
 * @author morhetz
 * Name: Gruvbox
 * From github.com/codemirror/codemirror5/blob/master/theme/gruvbox-light.css
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  light: true,
  background: '#fbf1c7',
  lineBackground: '#fbf1c799',
  foreground: '#3c3836',
  caret: '#af3a03',
  selection: '#ebdbb2',
  selectionMatch: '#bdae93',
  lineHighlight: '#ebdbb2',
  gutterBackground: '#ebdbb2',
  gutterForeground: '#665c54',
  gutterBorder: 'transparent',
};

export default createTheme({
  theme: 'light',
  settings: {
    background: '#fbf1c7',
    foreground: '#3c3836',
    caret: '#af3a03',
    selection: '#bdae9391',
    selectionMatch: '#bdae9391',
    lineHighlight: '#a37f2238',
    gutterBackground: '#ebdbb2',
    gutterForeground: '#665c54',
    gutterBorder: 'transparent',
  },
  styles: [
    { tag: t.keyword, color: '#9d0006' },
    {
      tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
      color: '#427b58',
    },
    { tag: [t.variableName], color: '#076678' },
    { tag: [t.function(t.variableName)], color: '#79740e', fontStyle: 'bold' },
    { tag: [t.labelName], color: '#3c3836' },
    {
      tag: [t.color, t.constant(t.name), t.standard(t.name)],
      color: '#8f3f71',
    },
    { tag: [t.definition(t.name), t.separator], color: '#3c3836' },
    { tag: [t.brace], color: '#3c3836' },
    {
      tag: [t.annotation],
      color: '#9d0006',
    },
    {
      tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
      color: '#8f3f71',
    },
    {
      tag: [t.typeName, t.className],
      color: '#b57614',
    },
    {
      tag: [t.operator, t.operatorKeyword],
      color: '#9d0006',
    },
    {
      tag: [t.tagName],
      color: '#427b58',
      fontStyle: 'bold',
    },
    {
      tag: [t.squareBracket],
      color: '#af3a03',
    },
    {
      tag: [t.angleBracket],
      color: '#076678',
    },
    {
      tag: [t.attributeName],
      color: '#427b58',
    },
    {
      tag: [t.regexp],
      color: '#427b58',
    },
    {
      tag: [t.quote],
      color: '#928374',
    },
    { tag: [t.string], color: '#3c3836' },
    {
      tag: t.link,
      color: '#7c6f64',
      textDecoration: 'underline',
      textUnderlinePosition: 'under',
    },
    {
      tag: [t.url, t.escape, t.special(t.string)],
      color: '#8f3f71',
    },
    { tag: [t.meta], color: '#b57614' },
    { tag: [t.comment], color: '#928374', fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold', color: '#af3a03' },
    { tag: t.emphasis, fontStyle: 'italic', color: '#79740e' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.heading, fontWeight: 'bold', color: '#79740e' },
    { tag: [t.heading1, t.heading2], fontWeight: 'bold', color: '#79740e' },
    {
      tag: [t.heading3, t.heading4],
      fontWeight: 'bold',
      color: '#b57614',
    },
    {
      tag: [t.heading5, t.heading6],
      color: '#b57614',
    },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#8f3f71' },
    {
      tag: [t.processingInstruction, t.inserted],
      color: '#076678',
    },
    {
      tag: [t.contentSeparator],
      color: '#9d0006',
    },
    { tag: t.invalid, color: '#af3a03', borderBottom: `1px dotted #9d0006` },
  ],
});
