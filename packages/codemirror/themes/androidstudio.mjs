/**
 * @name androidstudio
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  background: '#282b2e',
  lineBackground: '#282b2e99',
  foreground: '#a9b7c6',
  caret: '#00FF00',
  selection: '#343739',
  selectionMatch: '#343739',
  lineHighlight: '#343739',
};

export default createTheme({
  theme: 'dark',
  settings: {
    background: '#282b2e',
    foreground: '#a9b7c6',
    caret: '#00FF00',
    selection: '#4e5254',
    selectionMatch: '#4e5254',
    gutterForeground: '#cccccc50',
    lineHighlight: '#7f85891f',
  },
  styles: [
    { tag: t.labelName, color: 'inherit' },
    { tag: [t.keyword, t.deleted, t.className], color: '#a9b7c6' },
    { tag: [t.number, t.literal], color: '#6897bb' },
    //{ tag: [t.link, t.variableName], color: '#629755' },
    { tag: [t.link, t.variableName], color: '#a9b7c6' },
    { tag: [t.comment, t.quote], color: 'grey' },
    { tag: [t.meta, t.documentMeta], color: '#bbb529' },
    //{ tag: [t.string, t.propertyName, t.attributeValue], color: '#6a8759' },
    { tag: [t.propertyName, t.attributeValue], color: '#a9b7c6' },
    { tag: [t.string], color: '#6a8759' },
    { tag: [t.heading, t.typeName], color: '#ffc66d' },
    { tag: [t.attributeName], color: '#a9b7c6' },
    { tag: [t.emphasis], fontStyle: 'italic' },
  ],
});
