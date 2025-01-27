import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  light: true,
  background: '#FFFFFF',
  lineBackground: '#FFFFFF99',
  foreground: '#000000',
  caret: '#FBAC52',
  selection: '#FFD420',
  selectionMatch: '#FFD420',
  gutterBackground: '#f5f5f5',
  gutterForeground: '#4D4D4C',
  gutterBorder: 'transparent',
  lineHighlight: '#00000012',
};

export default createTheme({
  theme: 'light',
  settings: {
    background: '#FFFFFF',
    foreground: '#000000',
    caret: '#FBAC52',
    selection: '#FFD420',
    selectionMatch: '#FFD420',
    gutterBackground: '#f5f5f5',
    gutterForeground: '#4D4D4C',
    gutterBorder: 'transparent',
    lineHighlight: '#00000012',
  },
  styles: [
    { tag: [t.meta, t.comment], color: '#804000' },
    { tag: [t.keyword, t.strong], color: '#0000FF' },
    { tag: [t.number], color: '#FF0080' },
    { tag: [t.string], color: '#FF0080' },
    { tag: [t.variableName], color: '#006600' },
    { tag: [t.escape], color: '#33CC33' },
    { tag: [t.tagName], color: '#1C02FF' },
    { tag: [t.heading], color: '#0C07FF' },
    { tag: [t.quote], color: '#000000' },
    { tag: [t.list], color: '#B90690' },
    { tag: [t.documentMeta], color: '#888888' },
    { tag: [t.function(t.variableName)], color: '#0000A2' },
    { tag: [t.definition(t.typeName), t.typeName], color: '#6D79DE' },
  ],
});
