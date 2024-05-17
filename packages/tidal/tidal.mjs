import { reify } from '@strudel/core';
import { loadParser, run, parse } from 'hs2js';

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
  window.minicurry = (str) => (loc) => {
    console.log('minicurry', str, loc);
    return m(str, loc);
  };
  return loadParser();
}

export function tidal(code) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  let ast = parse(code).rootNode;
  // ast = transpile(ast);
  console.log('ast', ast);
  return run(ast, window, ops);
}

function edit(ast, options) {
  if (!ast || ast.skip) {
    return ast;
  }
  const { enter, leave } = options;
  ast = enter?.(ast);
  if (!ast.skip && ast.children) {
    const children = ast.children.map((child) => edit(child, options));
    ast = { type: ast.type, text: ast.text, children };
  }
  leave?.(ast);
  return ast;
}

function transpile(ast) {
  return edit(ast, {
    enter: (node) => {
      if (node.type === 'literal' && node.children[0].type === 'string') {
        return miniWithLocation(node.text, 1);
      }
      return node;
    },
  });
}

function miniWithLocation(string, loc) {
  return {
    type: 'apply',
    children: [
      {
        type: 'apply',
        skip: true,
        children: [
          { type: 'variable', text: 'minicurry', children: [] },
          { type: 'string', text: string, children: [] },
        ],
      },
      { type: 'float', text: loc + '', children: [] },
    ],
  };
}
