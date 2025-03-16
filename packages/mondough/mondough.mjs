import { strudelScope, reify, fast, slow, isControlName } from '@strudel/core';
import { MondoRunner } from '../mondo/mondo.mjs';

let runner = new MondoRunner(strudelScope, { pipepost: true });

//strudelScope.plain = reify;
strudelScope.plain = (v) => {
  // console.log('plain', v);
  return reify(v);
  // return v;
};
// strudelScope.number = (n) => n;
strudelScope.number = reify;

strudelScope.call = (fn, args, name) => {
  const [pat, ...rest] = args;
  if (!['seq', 'cat', 'stack'].includes(name)) {
    args = [...rest, pat];
  }

  // console.log('call', name, ...flipped);

  return fn(...args);
};

strudelScope['*'] = fast;
strudelScope['/'] = slow;

export function mondo(code, offset = 0) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  const pat = runner.run(code, { pipepost: true });
  return pat;
}
