/**
 * @name duotone
 * @author Bram de Haan
 * by Bram de Haan, adapted from DuoTone themes by Simurai (http://simurai.com/projects/2016/01/01/duotone-themes)
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  light: true,
  background: '#faf8f5',
  lineBackground: '#faf8f599',
  foreground: '#b29762',
  caret: '#93abdc',
  selection: '#e3dcce',
  selectionMatch: '#e3dcce',
  gutterBackground: '#faf8f5',
  gutterForeground: '#cdc4b1',
  gutterBorder: 'transparent',
  lineHighlight: '#EFEFEF',
};

export default createTheme({
  theme: 'light',
  settings: {
    background: '#faf8f5',
    foreground: '#b29762',
    caret: '#93abdc',
    selection: '#e3dcce',
    selectionMatch: '#e3dcce',
    gutterBackground: '#faf8f5',
    gutterForeground: '#cdc4b1',
    gutterBorder: 'transparent',
    lineHighlight: '#ddceb154',
  },
  styles: [
    { tag: [t.comment, t.bracket], color: '#b6ad9a' },
    { tag: [t.atom, t.number, t.keyword, t.link, t.attributeName, t.quote], color: '#063289' },
    { tag: [t.emphasis, t.heading, t.tagName, t.propertyName, t.variableName], color: '#2d2006' },
    { tag: [t.typeName, t.url, t.string], color: '#896724' },
    { tag: [t.operator, t.string], color: '#1659df' },
    { tag: [t.propertyName], color: '#b29762' },
    { tag: [t.unit, t.punctuation], color: '#063289' },
  ],
});
