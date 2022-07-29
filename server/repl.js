import repl from 'repl';
import { evalScope, evaluate } from '@strudel.cycles/eval';
import { AudioContext } from 'web-audio-api';
import Speaker from 'speaker';
import controls from '@strudel.cycles/core/controls.mjs';
import { prepareSamples, playBuffer } from './sampler.js';
import { randomHeadline } from './headline.js';

/*
  This is just a POC of how a strudel cli / repl could look like 
*/

// setup audio
const context = new AudioContext();
context.outStream = new Speaker({
  channels: context.format.numberOfChannels,
  bitDepth: context.format.bitDepth,
  sampleRate: context.sampleRate,
});
console.log('now loading samples..');
const buffers = await prepareSamples(context, './samples/');
console.log('');

// scheduler
let tick = 0;
const slice = 0.5;
const latency = 1;
/* console.log('latency', latency);
console.log('querying every', slice, 's'); */
const offset = context.currentTime + latency;
let pattern;
setInterval(() => {
  if (pattern) {
    try {
      pattern
        .queryArc(tick * slice, ++tick * slice)
        .filter((hap) => hap.hasOnset())
        .forEach((hap) => {
          const t = hap.whole.begin.valueOf() + offset;
          const { s, n } = hap.value;
          const bank = buffers[s];
          if (bank?.length) {
            const index = (n ?? 0) % bank.length;
            playBuffer(context, bank[index], t);
          }
        });
    } catch (err) {
      console.error('query error', err);
    }
  }
}, slice * 1000);

await evalScope(controls, import('@strudel.cycles/core'), import('@strudel.cycles/mini'));
console.log(`${randomHeadline()}

welcome to the experimental strudel cli <3

available samples: ${Object.entries(buffers)
  .map(([key, samples]) => `${key} (${samples.length})`)
  .join(', ')}   
you can add samples to the samples folder (.wav, .ogg, .mp3)

please enter a pattern, e.g. s("bd(3,8),~ sd,hh(3,8,1)")
`);
// repl
repl.start({
  prompt: '>>>',
  eval: async function myEval(cmd, context, filename, callback) {
    try {
      pattern = (await evaluate(cmd)).pattern;
    } catch (err) {
      console.error('query error', err.message);
    }
    callback(null);
  },
});
