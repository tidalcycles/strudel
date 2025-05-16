/*
 * Atom One
 * Atom One dark syntax theme
 *
 * https://github.com/atom/one-dark-syntax
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

const hex = ['#000000', '#ff5356', '#bd312a', '#54636D', '#171717'];

export const settings = {
  background: hex[0],
  lineBackground: 'transparent',
  foreground: hex[2],
  selection: hex[4],
  selectionMatch: hex[0],
  gutterBackground: hex[0],
  gutterForeground: hex[3],
  gutterBorder: 'transparent',
  lineHighlight: hex[0],
};

export default createTheme({
  theme: 'dark',
  settings,
  styles: [
    {
      tag: [t.function(t.variableName), t.function(t.propertyName), t.url, t.processingInstruction],
      color: hex[2],
    },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: hex[1] },
    { tag: t.comment, color: hex[3] },
    { tag: [t.variableName, t.propertyName, t.labelName], color: hex[2] },
    { tag: [t.attributeName, t.number], color: hex[1] },
    { tag: t.keyword, color: hex[2] },
    { tag: [t.string, t.regexp, t.special(t.propertyName)], color: hex[1] },
  ],
});
