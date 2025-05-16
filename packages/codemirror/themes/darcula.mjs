/*
 * darcula
 * Name: IntelliJ IDEA darcula theme
 * From IntelliJ IDEA by JetBrains
 */
import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';
export const settings = {
  background: '#242424',
  lineBackground: '#24242499',
  foreground: '#f8f8f2',
  caret: '#FFFFFF',
  selection: 'rgba(255, 255, 255, 0.1)',
  selectionMatch: 'rgba(255, 255, 255, 0.2)',
  gutterBackground: 'rgba(255, 255, 255, 0.1)',
  gutterForeground: '#999',
  gutterBorder: 'transparent',
  lineHighlight: 'rgba(255, 255, 255, 0.1)',
};

export default createTheme({
  theme: 'dark',
  settings: {
    background: '#242424',
    foreground: '#f8f8f2',
    caret: '#FFFFFF',
    selection: 'rgba(255, 255, 255, 0.1)',
    selectionMatch: 'rgba(255, 255, 255, 0.2)',
    gutterBackground: 'transparent',
    gutterForeground: '#999',
    gutterBorder: 'transparent',
    lineHighlight: 'rgba(255, 255, 255, 0.1)',
  },
  styles: [
    { tag: t.labelName, color: '#CCCCCC' },
    { tag: [t.atom, t.number], color: '#7A9EC2' },
    { tag: [t.comment], color: '#707070' },
    { tag: [t.string], color: '#6A8759' },
    { tag: [t.variableName, t.operator], color: '#CCCCCC' },
    { tag: [t.function(t.variableName), t.propertyName], color: '#FFC66D' },
    { tag: [t.meta, t.className], color: '#FFC66D' },
    { tag: [t.propertyName], color: '#FFC66D' },
    { tag: [t.keyword], color: '#CC7832' },
    { tag: [t.tagName], color: '#ff79c6' },
    { tag: [t.typeName], color: '#ffb86c' },
  ],
});
