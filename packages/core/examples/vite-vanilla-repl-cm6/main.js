import { StrudelMirror } from '@strudel/codemirror';
import { funk42 } from './tunes';
import { drawPianoroll, evalScope, controls } from '@strudel.cycles/core';
import './style.css';
import { initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import { transpiler } from '@strudel.cycles/transpiler';
import { getAudioContext, webaudioOutput, registerSynthSounds } from '@strudel.cycles/webaudio';
import { registerSoundfonts } from '@strudel.cycles/soundfonts';

// init canvas
const canvas = document.getElementById('roll');
canvas.width = canvas.width * 2;
canvas.height = canvas.height * 2;
const drawContext = canvas.getContext('2d');
const drawTime = [-2, 2]; // time window of drawn haps

const editor = new StrudelMirror({
  defaultOutput: webaudioOutput,
  getTime: () => getAudioContext().currentTime,
  transpiler,
  root: document.getElementById('editor'),
  initialCode: funk42,
  drawTime,
  onDraw: (haps, time) => drawPianoroll({ haps, time, ctx: drawContext, drawTime, fold: 0 }),
  prebake: async () => {
    initAudioOnFirstClick(); // needed to make the browser happy (don't await this here..)
    const loadModules = evalScope(
      controls,
      import('@strudel.cycles/core'),
      import('@strudel.cycles/mini'),
      import('@strudel.cycles/tonal'),
      import('@strudel.cycles/webaudio'),
    );
    await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts()]);
  },
});

document.getElementById('play').addEventListener('click', () => editor.evaluate());
document.getElementById('stop').addEventListener('click', () => editor.stop());
