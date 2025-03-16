import { strudelScope, reify, fast, slow } from '@strudel/core';
import { registerLanguage } from '@strudel/transpiler';
import { MondoRunner } from '../mondo/mondo.mjs';

let runner = new MondoRunner(strudelScope, { pipepost: true, loc: true });

let getLeaf = (value, token) => {
  const [from, to] = token.loc;
  return reify(value).withLoc(from, to);
};

strudelScope.plain = getLeaf;
strudelScope.number = getLeaf;
strudelScope.string = getLeaf;

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
