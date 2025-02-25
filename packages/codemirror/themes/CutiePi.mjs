/**
 * @name Cutie Pi
 * by Switch Angel
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';
const deepPurple = '#5c019a';
const yellowPink = '#fbeffc';
const grey = '#272C35';
const pinkAccent = '#fee1ff';
const lightGrey = '#465063';
const bratGreen = '#9acd3f';
const lighterGrey = '#97a1b7';
const pink = '#f6a6fd';

export const settings = {
  background: 'white',
  lineBackground: 'transparent',
  foreground: deepPurple,
  caret: '#797977',
  selection: yellowPink,
  selectionMatch: '#2B323D',
  gutterBackground: grey,
  gutterForeground: lightGrey,
  gutterBorder: 'transparent',
  lineHighlight: pinkAccent,
};

export default createTheme({
  theme: 'light',
  settings,
  styles: [
    {
      tag: [t.function(t.variableName), t.function(t.propertyName), t.url, t.processingInstruction],
      color: deepPurple,
    },
    { tag: [t.tagName, t.heading], color: settings.foreground },
    { tag: t.comment, color: lighterGrey },
    { tag: [t.variableName, t.propertyName, t.labelName], color: pink },
    { tag: [t.attributeName, t.number], color: '#d19a66' },
    { tag: t.className, color: grey },
    { tag: t.keyword, color: deepPurple },
    { tag: [t.string, t.regexp, t.special(t.propertyName)], color: bratGreen },
  ],
});
