import { evaluate, loadParser } from 'hs2js';

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
  return loadParser();
}

export function tidal(code) {
  return evaluate(code, window, ops);
}
