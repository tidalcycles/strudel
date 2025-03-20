import { strudelScope, reify, fast, slow, seq, stepcat, extend, expand, pace } from '@strudel/core';
import { registerLanguage } from '@strudel/transpiler';
import { MondoRunner } from '../mondo/mondo.mjs';

const tail = (friend, pat) => pat.fmap((a) => (b) => (Array.isArray(a) ? [...a, b] : [a, b])).appLeft(friend);

const arrayRange = (start, stop, step = 1) =>
  Array.from({ length: Math.abs(stop - start) / step + 1 }, (_, index) =>
    start < stop ? start + index * step : start - index * step,
  );
const range = (min, max) => min.squeezeBind((a) => max.bind((b) => seq(...arrayRange(a, b))));

let lib = {};
lib.curly = stepcat;
lib.square = (...args) => stepcat(...args).setSteps(1);
lib.angle = (...args) => stepcat(...args).pace(1);
lib['*'] = fast;
lib['/'] = slow;
lib['!'] = extend;
lib['@'] = expand;
lib['%'] = pace;
lib[':'] = tail;
lib['..'] = range;

let runner = new MondoRunner({
  call(name, args, scope) {
    const fn = lib[name] || strudelScope[name];
    if (!fn) {
      throw new Error(`[moundough]: unknown function "${name}"`);
    }
    if (!['square', 'angle', 'stack', 'curly'].includes(name)) {
      // flip args (pat to end)
      const [pat, ...rest] = args;
      args = [...rest, pat];
    }
    return fn(...args);
  },
  leaf(token, scope) {
    let { value } = token;
    // local scope
    if (token.type === 'plain' && scope[value]) {
      return reify(scope[value]); // -> local scope has no location
    }
    const [from, to] = token.loc;
    if (token.type === 'plain' && strudelScope[value]) {
      // what if we want a string that happens to also be a variable name?
      // example: "s sine" -> sine is also a variable
      return reify(strudelScope[value]).withLoc(from, to);
    }
    return reify(value).withLoc(from, to);
  },
});

export function mondo(code, offset = 0) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  const pat = runner.run(code, offset);
  return pat.markcss('color: var(--foreground);text-decoration:underline');
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
// uncomment the following to use mondo as mini notation language
/* registerLanguage('minilang', {
  name: 'mondi',
  getLocations,
}); */
