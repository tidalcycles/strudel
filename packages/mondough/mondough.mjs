import {
  strudelScope,
  reify,
  fast,
  slow,
  seq,
  stepcat,
  extend,
  expand,
  pace,
  chooseIn,
  degradeBy,
  silence,
} from '@strudel/core';
import { registerLanguage } from '@strudel/transpiler';
import { MondoRunner } from '../mondo/mondo.mjs';

const tail = (friend, pat) => pat.fmap((a) => (b) => (Array.isArray(a) ? [...a, b] : [a, b])).appLeft(friend);

const arrayRange = (start, stop, step = 1) =>
  Array.from({ length: Math.abs(stop - start) / step + 1 }, (_, index) =>
    start < stop ? start + index * step : start - index * step,
  );
const range = (max, min) => min.squeezeBind((a) => max.bind((b) => seq(...arrayRange(a, b))));

let nope = (...args) => args[args.length - 1];

let lib = {};
lib['nope'] = nope;
lib['-'] = silence;
lib['~'] = silence;
lib.curly = stepcat;
lib.square = (...args) => stepcat(...args).setSteps(1);
lib.angle = (...args) => stepcat(...args).pace(1);
lib['*'] = fast;
lib['/'] = slow;
lib['!'] = extend;
lib['@'] = expand;
lib['%'] = pace;
lib['?'] = degradeBy; // todo: default 0.5 not working..
lib[':'] = tail;
lib['..'] = range;
lib['or'] = (...children) => chooseIn(...children); // always has structure but is cyclewise.. e.g. "s oh*8.dec[.04 | .5]"
//lib['or'] = (...children) => chooseOut(...children); // "s oh*8.dec[.04 | .5]" is better but "dec[.04 | .5].s oh*8" has no struct

function evaluator(node, scope) {
  const { type } = node;
  // node is list
  if (type === 'list') {
    const { children } = node;
    const [name, ...args] = children;
    if (name.value === 'def') {
      return silence;
    }
    // name is expected to be a pattern of functions!
    const first = name.firstCycle(true)[0];
    const type = typeof first?.value;
    if (type !== 'function') {
      throw new Error(`[mondough] "${first}" is not a function, got ${type} ...`);
    }
    return name
      .fmap((fn) => {
        if (typeof fn !== 'function') {
          throw new Error(`[mondough] "${fn}" is not a function b`);
        }
        return fn(...args);
      })
      .innerJoin();
  }
  // node is leaf
  let { value } = node;
  if (type === 'plain' && scope[value]) {
    return reify(scope[value]); // -> local scope has no location
  }
  const variable = lib[value] ?? strudelScope[value];
  let pat;
  if (type === 'plain' && typeof variable !== 'undefined') {
    // problem: collisions when we want a string that happens to also be a variable name
    // example: "s sine" -> sine is also a variable
    pat = reify(variable);
  } else {
    pat = reify(value);
  }
  if (node.loc) {
    pat = pat.withLoc(node.loc[0], node.loc[1]);
  }
  return pat;
}

let runner = new MondoRunner({ evaluator });

export function mondo(code, offset = 0) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  const pat = runner.run(code, offset);
  return pat.markcss('color: var(--caret,--foreground);text-decoration:underline');
}

let getLocations = (code, offset) => runner.parser.get_locations(code, offset);

export const mondi = (str, offset) => {
  const code = `[${str}]`;
  return mondo(code, offset);
};

// tell transpiler how to get locations for mondo`` calls
registerLanguage('mondo', {
  getLocations,
});

// this is like mondo, but with a zero offset
export const mondolang = (code) => mondo(code, 0);
registerLanguage('mondolang', {
  getLocations: (code) => getLocations(code, 0),
});
// uncomment the following to use mondo as mini notation language
/* registerLanguage('minilang', {
  name: 'mondi',
  getLocations,
}); */
