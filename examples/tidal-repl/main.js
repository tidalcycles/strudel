import { run, parse, loadParser } from 'hs2js';
import { initStrudel, reify, late, samples, stack } from '@strudel/web';

initStrudel({
  prebake: () => samples('github:tidalcycles/dirt-samples'),
});

const ready = loadParser();

const textarea = document.getElementById('code');
if (window.location.hash) {
  textarea.value = atob(window.location.hash.slice(1));
} else {
  textarea.value = 'd1 $ s "jvbass(3,8)"';
}
textarea.addEventListener('input', (e) => {
  window.location.hash = btoa(e.target.value);
  update();
});
update();

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

async function update() {
  let result, tree;
  await ready;
  try {
    tree = parse(textarea.value);
  } catch (err) {
    console.warn('parse error');
    console.error(err);
  }
  console.log('parsed tree');
  console.log(tree.rootNode.toString());
  try {
    let patterns = {};
    window.p = (name, pattern) => {
      patterns[name] = pattern;
    };
    window.d1 = (pat) => window.p(1, pat);
    window.d2 = (pat) => window.p(2, pat);
    window.d3 = (pat) => window.p(3, pat);
    window.rot = late;
    result = run(tree.rootNode, window, ops);
    if (Object.values(patterns).length) {
      stack(...Object.values(patterns)).play();
    }
  } catch (err) {
    console.warn('eval error');
    console.error(err);
    result = 'ERROR: ' + err.message;
  }
  document.getElementById('result').innerHTML = 'Result: ' + result;
}
