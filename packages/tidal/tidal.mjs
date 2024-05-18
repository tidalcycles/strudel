import { reify } from '@strudel/core';
import { m } from '@strudel/mini';
import { loadParser, evaluate } from 'hs2js';

function getInfixOperators() {
  let operators = {
    '>': 'set',
    '#': 'set',
    '+': 'add',
    '-': 'sub',
    '*': 'mul',
    '/': 'div',
  };
  let alignments = {
    in: (s) => '|' + s,
    out: (s) => s + '|',
    mix: (s) => '|' + s + '|',
  };
  let ops = {};
  Object.entries(operators).forEach(([o, name]) => {
    // operator without alignment
    ops[o] = (l, r) => reify(l)[name](reify(r));
    Object.entries(alignments).forEach(([a, getSymbol]) => {
      // get symbol with alignment
      let symbol = getSymbol(o);
      ops[symbol] = (l, r) => reify(l)[name][a](reify(r));
    });
  });
  ops['~>'] = (l, r) => reify(l).late(reify(r));
  ops['<~'] = (l, r) => reify(l).early(reify(r));
  ops['<$>'] = (l, r) => reify(r).fmap(l).outerJoin(); // is this right?
  return ops;
}
const ops = getInfixOperators();

export async function initTidal() {
  // TODO: implement this in regular land
  window.d1 = (pat) => pat.p('d1');
  window.d2 = (pat) => pat.p('d2');
  window.d3 = (pat) => pat.p('d3');
  window.d4 = (pat) => pat.p('d4');
  window.d5 = (pat) => pat.p('d5');
  window.d6 = (pat) => pat.p('d6');
  window.d7 = (pat) => pat.p('d7');
  window.d8 = (pat) => pat.p('d8');
  window.d9 = (pat) => pat.p('d9');
  return loadParser();
}

// offset is expected to be passed in from transpiler
/* 
1. acorn parses JS to find location of tidal call
2. haskell-tree-sitter calls "string" function with node (including location)
3. m function sets locations for individual mini notation atom

so the location for a mini notation atom is:

js offset + hs offset + atom offset
*/
export function tidal(code, offset = 0) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  return evaluate(code, window, {
    ...ops,
    string: (node) => {
      // parses strings as mini notation and passes location
      const str = node.text.slice(1, -1);
      const col = node.startIndex + offset;
      return m(str, col);
    },
  });
}
