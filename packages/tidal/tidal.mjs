import { reify } from '@strudel/core';
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
  ops['string'] = (node) => {
    const str = node.text.slice(1, -1);
    console.log('string node', node);
    return m(str, 1);
  };
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

export function tidal(code) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  return evaluate(code, window, ops);
}
