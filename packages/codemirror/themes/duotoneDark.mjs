/**
 * @name duotone
 * @author Bram de Haan
 * by Bram de Haan, adapted from DuoTone themes by Simurai (http://simurai.com/projects/2016/01/01/duotone-themes)
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  background: '#2a2734',
  lineBackground: '#2a273499',
  foreground: '#eeebff',
  caret: '#ffad5c',
  selection: 'rgba(255, 255, 255, 0.1)',
  gutterBackground: '#2a2734',
  gutterForeground: '#545167',
  lineHighlight: '#36334280',
};

export default createTheme({
  theme: 'dark',
  settings: {
    background: '#2a2734',
    foreground: '#6c6783',
    caret: '#ffad5c',
    selection: '#9a86fd',
    selectionMatch: '#9a86fd',
    gutterBackground: '#2a2734',
    gutterForeground: '#545167',
    lineHighlight: '#36334280',
  },
  styles: [
    { tag: [t.comment, t.bracket, t.operator], color: '#6c6783' },
    { tag: [t.atom, t.number, t.keyword, t.link, t.attributeName, t.quote], color: '#ffcc99' },
    { tag: [t.emphasis, t.heading, t.tagName, t.propertyName, t.className, t.variableName], color: '#eeebff' },
    { tag: [t.typeName, t.url], color: '#eeebff' },
    { tag: t.string, color: '#ffb870' },
    /* { tag: [t.propertyName], color: '#9a86fd' }, */
    { tag: [t.propertyName], color: '#eeebff' },
    { tag: t.labelName, color: '#eeebff' },
  ],
});
