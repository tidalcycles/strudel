import { strudelScope, reify, fast, slow, seq } from '@strudel/core';
import { registerLanguage } from '@strudel/transpiler';
import { MondoRunner } from '../mondo/mondo.mjs';

let runner = new MondoRunner(strudelScope);

strudelScope.leaf = (token, scope) => {
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
};

strudelScope.call = (fn, args, name) => {
  const [pat, ...rest] = args;
  if (!['seq', 'cat', 'stack', ':', '..', '!', '@', '%'].includes(name)) {
    args = [...rest, pat];
  }
  if (name === 'seq') {
    return stepcat(...args).setSteps(1);
  }
  if (name === 'cat') {
    return stepcat(...args).pace(1);
  }
  return fn(...args);
};

strudelScope['*'] = fast;
strudelScope['/'] = slow;
strudelScope['!'] = (pat, n) => pat.extend(n);
strudelScope['@'] = (pat, n) => pat.expand(n);
strudelScope['%'] = (pat, n) => pat.pace(n);

// : operator
const tail = (pat, friend) => pat.fmap((a) => (b) => (Array.isArray(a) ? [...a, b] : [a, b])).appLeft(friend);
strudelScope[':'] = tail;

// .. operator
const arrayRange = (start, stop, step = 1) =>
  Array.from({ length: Math.abs(stop - start) / step + 1 }, (_, index) =>
    start < stop ? start + index * step : start - index * step,
  );
const range = (min, max) => min.squeezeBind((a) => max.bind((b) => seq(...arrayRange(a, b))));
strudelScope['..'] = range;

export function mondo(code, offset = 0) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  const pat = runner.run(code, offset);
  return pat.markcss('color: var(--foreground);text-decoration:underline');
}

// tell transpiler how to get locations for mondo`` calls
registerLanguage('mondo', {
  getLocations: (code, offset) => runner.parser.get_locations(code, offset),
});
