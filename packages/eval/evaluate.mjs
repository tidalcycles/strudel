import shapeshifter from './shapeshifter.mjs';
import * as strudel from '@strudel/core';

const { isPattern } = strudel;

export const extend = (...args) => {
  // TODO: find a way to make args available to eval without adding it to global scope...
  // sadly, "with" does not work in strict mode
  Object.assign(globalThis, ...args);
};

export const evaluate = async (code) => {
  const shapeshifted = shapeshifter(code); // transform syntactically correct js code to semantically usable code
  let evaluated = await eval(shapeshifted);
  if (!isPattern(evaluated)) {
    console.log('evaluated', evaluated);
    const message = `got "${typeof evaluated}" instead of pattern`;
    throw new Error(message + (typeof evaluated === 'function' ? ', did you forget to call a function?' : '.'));
  }
  return { mode: 'javascript', pattern: evaluated };
};
