/**
 * @name github
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  light: true,
  background: '#fff',
  lineBackground: '#ffffff99',
  foreground: '#24292e',
  selection: '#BBDFFF',
  selectionMatch: '#BBDFFF',
  gutterBackground: '#fff',
  gutterForeground: '#6e7781',
};

export default createTheme({
  theme: 'light',
  settings: {
    background: '#fff',
    foreground: '#24292e',
    selection: '#BBDFFF',
    selectionMatch: '#BBDFFF',
    gutterBackground: '#fff',
    gutterForeground: '#6e7781',
  },
  styles: [
    { tag: [t.standard(t.tagName), t.tagName], color: '#116329' },
    { tag: [t.comment, t.bracket], color: '#6a737d' },
    { tag: [t.className, t.propertyName], color: '#6f42c1' },
    { tag: [t.variableName, t.attributeName, t.number, t.operator], color: '#005cc5' },
    { tag: [t.keyword, t.typeName, t.typeOperator, t.typeName], color: '#d73a49' },
    { tag: [t.string, t.meta, t.regexp], color: '#032f62' },
    { tag: [t.name, t.quote], color: '#22863a' },
    { tag: [t.heading, t.strong], color: '#24292e', fontWeight: 'bold' },
    { tag: [t.emphasis], color: '#24292e', fontStyle: 'italic' },
    { tag: [t.deleted], color: '#b31d28', backgroundColor: 'ffeef0' },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#e36209' },
    { tag: [t.url, t.escape, t.regexp, t.link], color: '#032f62' },
    { tag: t.link, textDecoration: 'underline' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.invalid, color: '#cb2431' },
  ],
});
