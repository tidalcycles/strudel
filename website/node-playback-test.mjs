import { AudioContext } from 'node-web-audio-api';
import { evaluate } from '@strudel.cycles/transpiler';
import { renderHap } from '@strudel.cycles/webaudio/render.mjs';
import { evalScope, controls } from '@strudel.cycles/core';
import { zeldasRescue as tune } from './src/repl/tunes.mjs';

// tunes with cracks and pops: meltingsubmarine, hyperpop, juxUndTollerei (once)
// tunes not working: loungeSponge (csound), undergroundPlumber (draw)

await evalScope(
  controls, //
  import('@strudel.cycles/core'), //
  import('@strudel.cycles/mini'), //
  import('@strudel.cycles/tonal'), //
  // import('@strudel.cycles/webaudio'), // currently fails in node: uses document
  {
    samples: () => {
      console.log('samples() skipped');
    },
    loadCsound: () => {
      console.log('csound output is not available in node yet..');
    },
  },
);

const audioContext = new AudioContext();
const latency = 0.2;
const seconds = 20;

const { pattern } = await evaluate(tune);
pattern
  .queryArc(0, seconds)
  .filter((hap) => hap.hasOnset() && hap.whole.begin >= 0)
  .map((hap) => {
    renderHap(audioContext, hap, hap.whole.begin + latency);
  });
