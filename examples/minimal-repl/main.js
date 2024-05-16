import { repl, evalScope } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import tune from './tune.mjs';

const ctx = getAudioContext();
const input = document.getElementById('text');
input.innerHTML = tune;
initAudioOnFirstClick();
registerSynthSounds();

evalScope(import('@strudel/core'), import('@strudel/mini'), import('@strudel/webaudio'), import('@strudel/tonal'));

const { evaluate } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime,
  transpiler,
});
document.getElementById('start').addEventListener('click', () => {
  ctx.resume();
  console.log('eval', input.value);
  evaluate(input.value);
});
