import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  background: '#222',
  lineBackground: '#22222299',
  foreground: '#fff',
  // foreground: '#75baff',
  caret: '#ffcc00',
  selection: 'rgba(128, 203, 196, 0.5)',
  selectionMatch: '#036dd626',
  // lineHighlight: '#8a91991a', // original
  lineHighlight: '#00000050',
  gutterBackground: 'transparent',
  // gutterForeground: '#8a919966',
  gutterForeground: '#8a919966',
};

export default createTheme({
  theme: 'dark',
  settings,
  styles: [
    { tag: t.labelName, color: '#89ddff' },
    { tag: t.keyword, color: '#c792ea' },
    { tag: t.operator, color: '#89ddff' },
    { tag: t.special(t.variableName), color: '#eeffff' },
    // { tag: t.typeName, color: '#f07178' }, // original
    { tag: t.typeName, color: '#c3e88d' },
    { tag: t.atom, color: '#f78c6c' },
    // { tag: t.number, color: '#ff5370' }, // original
    { tag: t.number, color: '#c3e88d' },
    { tag: t.definition(t.variableName), color: '#82aaff' },
    { tag: t.string, color: '#c3e88d' },
    //     { tag: t.special(t.string), color: '#f07178' }, // original
    { tag: t.special(t.string), color: '#c3e88d' },
    { tag: t.comment, color: '#7d8799' },
    // { tag: t.variableName, color: '#f07178' }, // original
    { tag: t.variableName, color: '#c792ea' },
    // { tag: t.tagName, color: '#ff5370' }, // original
    { tag: t.tagName, color: '#c3e88d' },
    { tag: t.bracket, color: '#525154' },
    // { tag: t.bracket, color: '#a2a1a4' }, // original
    { tag: t.meta, color: '#ffcb6b' },
    { tag: t.attributeName, color: '#c792ea' },
    { tag: t.propertyName, color: '#c792ea' },

    { tag: t.className, color: '#decb6b' },
    { tag: t.invalid, color: '#ffffff' },
    { tag: [t.unit, t.punctuation], color: '#82aaff' },
  ],
});
