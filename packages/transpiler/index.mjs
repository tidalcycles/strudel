import core from '@strudel.cycles/core';
import { transpiler } from './transpiler.mjs';
export * from './transpiler.mjs';

export const evaluate = (code) => core.evaluate(code, transpiler);
