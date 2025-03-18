import { strudelScope, reify, fast, slow } from '@strudel/core';
import { registerLanguage } from '@strudel/transpiler';
import { MondoRunner } from '../mondo/mondo.mjs';

let runner = new MondoRunner(strudelScope);

strudelScope.leaf = (token) => {
  let { value } = token;
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
  if (!['seq', 'cat', 'stack'].includes(name)) {
    args = [...rest, pat];
  }
  return fn(...args);
};

strudelScope['*'] = fast;
strudelScope['/'] = slow;

export function mondo(code, offset = 0) {
  if (Array.isArray(code)) {
    code = code.join('');
  }
  const pat = runner.run(code, offset);
  return pat;
}

// tell transpiler how to get locations for mondo`` calls
registerLanguage('mondo', {
  getLocations: (code, offset) => runner.parser.get_locations(code, offset),
});
