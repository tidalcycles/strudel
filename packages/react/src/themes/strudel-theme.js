import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
export default createTheme({
  theme: 'dark',
  settings: {
    background: '#222',
    foreground: '#75baff', // whats that?
    caret: '#ffcc00',
    selection: 'rgba(128, 203, 196, 0.5)',
    selectionMatch: '#036dd626',
    lineHighlight: '#8a91991a',
    gutterBackground: 'transparent',
    // gutterForeground: '#8a919966',
    gutterForeground: '#676e95',
  },
  styles: [
    { tag: t.keyword, color: '#c792ea' },
    { tag: t.operator, color: '#89ddff' },
    { tag: t.special(t.variableName), color: '#eeffff' },
    { tag: t.typeName, color: '#f07178' },
    { tag: t.atom, color: '#f78c6c' },
    { tag: t.number, color: '#ff5370' },
    { tag: t.definition(t.variableName), color: '#82aaff' },
    { tag: t.string, color: '#c3e88d' },
    { tag: t.special(t.string), color: '#f07178' },
    { tag: t.comment, color: '#7d8799' },
    { tag: t.variableName, color: '#f07178' },
    { tag: t.tagName, color: '#ff5370' },
    { tag: t.bracket, color: '#a2a1a4' },
    { tag: t.meta, color: '#ffcb6b' },
    { tag: t.attributeName, color: '#c792ea' },
    { tag: t.propertyName, color: '#c792ea' },
    { tag: t.className, color: '#decb6b' },
    { tag: t.invalid, color: '#ffffff' },
  ],
});
