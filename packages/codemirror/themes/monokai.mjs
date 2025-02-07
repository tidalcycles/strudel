import { tags as t } from '@lezer/highlight';
import { createTheme } from './theme-helper.mjs';

export const settings = {
  background: '#272822',
  lineBackground: '#27282299',
  foreground: '#FFFFFF',
  caret: '#FFFFFF',
  selection: '#49483E',
  selectionMatch: '#49483E',
  gutterBackground: '#272822',
  gutterForeground: '#FFFFFF70',
  lineHighlight: '#00000059',
};

export default createTheme({
  theme: 'dark',
  settings: {
    background: '#272822',
    foreground: '#FFFFFF',
    caret: '#FFFFFF',
    selection: '#49483E',
    selectionMatch: '#49483E',
    gutterBackground: '#272822',
    gutterForeground: '#FFFFFF70',
    lineHighlight: '#0000003b',
  },
  styles: [
    { tag: t.labelName, color: '#bababa' },
    { tag: [t.comment, t.documentMeta], color: '#8292a2' },
    { tag: [t.number, t.bool, t.null, t.atom], color: '#ae81ff' },
    { tag: [t.attributeValue, t.className, t.name], color: '#e6db74' },
    { tag: [t.propertyName, t.attributeName], color: '#a6e22e' },
    { tag: [t.variableName], color: '#9effff' },
    { tag: [t.squareBracket], color: '#bababa' },
    { tag: [t.string, t.special(t.brace)], color: '#e6db74' },
    { tag: [t.regexp, t.className, t.typeName, t.definition(t.typeName)], color: '#66d9ef' },
    {
      tag: [t.definition(t.variableName), t.definition(t.propertyName), t.function(t.variableName)],
      color: '#a6e22e',
    },
    // { tag: t.keyword, color: '#f92672' },
    { tag: [t.keyword, t.definitionKeyword, t.modifier, t.tagName, t.angleBracket], color: '#f92672' },
  ],
});
