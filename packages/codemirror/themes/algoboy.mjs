import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

const palettes = {
  // https://www.deviantart.com/advancedfan2020/art/Game-Boy-Palette-Set-Color-HEX-Part-09-920495662
  'Central Florida A': ['#FFF630', '#B3AC22', '#666213', '#191905'],
  'Central Florida B': ['#38CEBA', '#279082', '#16524A', '#061513'],
  'Central Florida C': ['#FF8836', '#B35F26', '#663616', '#190E05'],
  'Central Florida D': ['#E07070', '#9D4E4E', '#5A2D2D', '#160B0B'],
  'Central Florida E': ['#7AA4CB', '#55738E', '#314251', '#0C1014'],
  'Feminine Energy A': ['#DC5686', '#9A415E', '#582536', '#16090D'],
  'Feminine Energy B': ['#D0463C', '#92312A', '#531c18', '#150706'],
  'Feminine Energy C': ['#D86918', '#974A11', '#562A0A', '#160A02'],
  'Feminine Energy D': ['#EFC54F', '#A78A36', '#604F20', '#181408'],
  'Feminine Energy E': ['#866399', '#5e456b', '#36283d', '#0d0a0f'],
  'Sour Watermelon A': ['#993366', '#6B2447', '#3D1429', '#0F050A'],
  'Sour Watermelon B': ['#996666', '#6B4747', '#3D2929', '#0F0A0A'],
  'Sour Watermelon C': ['#999966', '#686B47', '#3d3d29', '#0f0f0A'],
  'Sour Watermelon D': ['#99cc66', '#6b8f47', '#3d5229', '#0f140a'],
  'Sour Watermelon E': ['#99ff66', '#6bb347', '#3d6629', '#0f190a'],
  //https://www.deviantart.com/advancedfan2020/art/Game-Boy-Palette-Set-Color-HEX-Part-02-920073260
  'Peri Peaceful A': ['#909BE9', '#656DA3', '#3A3E5D', '#0e0f17'],
  'Peri Peaceful B': ['#68628d', '#494563', '#2a2738', '#0a0a0e'], // pretty dim
  'Peri Peaceful E': ['#b5a0a9', '#7f7076', '#484044', '#121011'],
  'Hichem Palette B': ['#4fa3a5', '#377273', '#204142', '#081010'],
  'Hichem Palette C': ['#Fe6f9b', '#b24e6d', '#662c3e', '#190b0f'],
  'Hichem Palette D': ['#ffbb5a', '#b3833f', '#664b24', '#191309'],
  'JSR2 A': ['#E0EFC0', '#9da786', '#5a604d', '#161813'],
};
const palette = palettes['Sour Watermelon B'];
export const settings = {
  background: palette[3],
  foreground: palette[1],
  caret: palette[0],
  selection: palette[0],
  selectionMatch: palette[1],
  lineHighlight: palette[3],
  lineBackground: palette[3] + '90',
  //lineBackground: 'transparent',
  gutterBackground: 'transparent',
  gutterForeground: palette[0],
  light: false,
  // customStyle: '.cm-line { line-height: 1 }',
};
export default createTheme({
  theme: 'dark',
  settings,
  styles: [
    { tag: t.comment, color: palette[2] },
    { tag: t.string, color: palette[1] },
    { tag: [t.atom, t.number], color: palette[1] },
    { tag: [t.meta, t.labelName, t.variableName], color: palette[0] },
    {
      tag: [t.keyword, t.tagName, t.arithmeticOperator],
      color: palette[1],
    },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: palette[0] },
    { tag: [t.function(t.variableName), t.propertyName], color: palette[0] },
    { tag: t.atom, color: palette[1] },
  ],
});
