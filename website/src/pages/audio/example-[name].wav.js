import { OfflineAudioContext } from 'node-web-audio-api';
import toWav from 'audiobuffer-to-wav';
import { evaluate } from '@strudel.cycles/transpiler';
import { renderHap } from '@strudel.cycles/webaudio/render.mjs';
import { evalScope, controls } from '@strudel.cycles/core';
import * as tunes from '../../repl/tunes.mjs';

await evalScope(
  controls, //
  import('@strudel.cycles/core'), //
  import('@strudel.cycles/mini'), //
  import('@strudel.cycles/tonal'), //
  // import('@strudel.cycles/webaudio'), // need document..
  {
    samples: () => {
      console.log('samples() skipped');
    },
  },
);

export async function get({ params, request }) {
  const { name } = params;
  const tune = tunes[name];
  const channels = 1;
  const seconds = 20;
  const sampleRate = 44100;
  const offline = new OfflineAudioContext(channels, sampleRate * seconds, sampleRate);

  // const { pattern } = await evaluate(`"<c a f e>(3,8)".off(1/8, add(7)).note().s('sawtooth').lpf(2000)`);
  const { pattern } = await evaluate(tune);
  pattern
    .queryArc(0, seconds)
    .filter((hap) => hap.hasOnset() && hap.whole.begin >= 0)
    .map((hap) => {
      renderHap(offline, hap, hap.whole.begin);
    });

  const buffer = await offline.startRendering();
  const wav = toWav(buffer);
  return {
    body: wav,
    encoding: 'binary',
  };
}

export function getStaticPaths() {
  return Object.keys(tunes).map((name) => ({
    params: {
      name,
    },
  }));
}
