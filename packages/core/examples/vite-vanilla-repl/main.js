import { controls, repl, evalScope } from '@strudel.cycles/core';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import shapeshifter from '@strudel.cycles/eval/shapeshifter.mjs';
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

const { evaluate } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime,
  transpiler: shapeshifter,
});
document.getElementById('start').addEventListener('click', () => {
  ctx.resume();
  evaluate(input.value);
});
