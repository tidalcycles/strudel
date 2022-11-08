import { controls, repl, evalScope, setStringParser } from '@strudel.cycles/core';
import { mini } from '@strudel.cycles/mini';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
// import { transpiler } from '@strudel.cycles/transpiler';
import tune from './tune.mjs';

const ctx = getAudioContext();
const input = document.getElementById('text');
input.innerHTML = tune;

evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/tonal'),
);

setStringParser(mini)

const { evaluate } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime,
  // transpiler,
});
document.getElementById('start').addEventListener('click', () => {
  ctx.resume();
  evaluate(input.value);
});
