// this is a poc of how a pattern can be rendered as a wav file using node
// run via: node dough-export.mjs
import fs from 'node:fs';
import WavEncoder from 'wav-encoder';
import { evalScope } from '@strudel/core';
import { miniAllStrings } from '@strudel/mini';
import { Dough } from './dough.mjs';

await evalScope(
  import('@strudel/core'),
  import('@strudel/mini'),
  import('@strudel/tonal'),
  // import('@strudel/tonal'),
);

miniAllStrings(); // allows using single quotes for mini notation / skip transpilation

let sampleRate = 48000,
  cps = 0.5;

let pat = note('[c e g b]*3')
  .add(note(7))
  .lpf(sine.rangex(200, 4000).slow(2))
  .lpq(0.3)
  .s('<pulse saw tri>*2')
  .att(0.01)
  .rel(0.2)
  .clip(2)
  .delay(0.5)
  .jux(rev)
  .sometimes(add(note(12)))
  .gain(0.25)
  .slow(1 / cps);

let cycles = 4;
let seconds = cycles + 1; // 1s release tail
const haps = pat.queryArc(0, cycles);

const dough = new Dough(sampleRate);

console.log('spawn voices...');
haps.forEach((hap) => {
  hap.value._begin = Number(hap.whole.begin);
  hap.value._duration = hap.duration / cps;
  dough.scheduleSpawn(hap.value);
});
console.log(`render ${seconds}s long buffer...`);
const buffer = new Float32Array(seconds * sampleRate);
while (dough.t <= buffer.length) {
  dough.update();
  buffer[dough.t] = dough.out[0];
}
console.log('done!');

const patternAudio = {
  sampleRate,
  channelData: [buffer],
};

WavEncoder.encode(patternAudio).then((buffer) => {
  fs.writeFileSync('pattern.wav', new Float32Array(buffer));
});
