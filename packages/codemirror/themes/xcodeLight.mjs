import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  light: true,
  background: '#fff',
  lineBackground: '#ffffff99',
  foreground: '#3D3D3D',
  selection: '#BBDFFF',
  selectionMatch: '#BBDFFF',
  gutterBackground: '#fff',
  gutterForeground: '#AFAFAF',
  lineHighlight: '#EDF4FF',
};

export default createTheme({
  theme: 'light',
  settings: {
    background: '#fff',
    foreground: '#3D3D3D',
    selection: '#BBDFFF',
    selectionMatch: '#BBDFFF',
    gutterBackground: '#fff',
    gutterForeground: '#AFAFAF',
    lineHighlight: '#d5e6ff69',
  },
  styles: [
    { tag: [t.comment, t.quote], color: '#707F8D' },
    { tag: [t.typeName, t.typeOperator], color: '#aa0d91' },
    { tag: [t.keyword], color: '#aa0d91', fontWeight: 'bold' },
    { tag: [t.string, t.meta], color: '#D23423' },
    { tag: [t.name], color: '#032f62' },
    { tag: [t.typeName], color: '#522BB2' },
    { tag: [t.variableName], color: '#23575C' },
    { tag: [t.definition(t.variableName)], color: '#327A9E' },
    { tag: [t.regexp, t.link], color: '#0e0eff' },
  ],
});
