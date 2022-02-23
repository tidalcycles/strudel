import * as strudel from '../../strudel.mjs';
import './tone';
import './midi';
import './voicings';
import './tonal';
import shapeshifter from './shapeshifter';
import { minify } from './parse';
import * as Tone from 'tone';
import * as toneHelpers from './tone';

// this will add all methods from definedMethod to strudel + connect all the partial application stuff
const bootstrapped: any = { ...strudel, ...strudel.Pattern.prototype.bootstrap() };
// console.log('bootstrapped',bootstrapped.transpose(2).transpose);

function hackLiteral(literal, names, func) {
  names.forEach((name) => {
    Object.defineProperty(literal.prototype, name, {
      get: function () {
        return func(String(this));
      },
    });
  });
}

// with this, you can do 'c2 [eb2 g2]'.mini.fast(2) or 'c2 [eb2 g2]'.m.fast(2),
hackLiteral(String, ['mini', 'm'], bootstrapped.mini); // comment out this line if you panic
hackLiteral(String, ['pure', 'p'], bootstrapped.pure); // comment out this line if you panic

// this will add everything to global scope, which is accessed by eval
Object.assign(globalThis, bootstrapped, Tone, toneHelpers);

export const evaluate: any = (code: string) => {
  const shapeshifted = shapeshifter(code); // transform syntactically correct js code to semantically usable code
  // console.log('shapeshifted', shapeshifted);
  let evaluated = eval(shapeshifted);
  if (typeof evaluated === 'function') {
    evaluated = evaluated();
  }
  if (typeof evaluated === 'string') {
    evaluated = strudel.withLocationOffset(minify(evaluated), { start: { line: 1, column: -1 } });
  }
  if (evaluated?.constructor?.name !== 'Pattern') {
    const message = `got "${typeof evaluated}" instead of pattern`;
    throw new Error(message + (typeof evaluated === 'function' ? ', did you forget to call a function?' : '.'));
  }
  return { mode: 'javascript', pattern: evaluated };
};
