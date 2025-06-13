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
  cps = 0.4;

/* await doughsamples('github:eddyflux/crate');
await doughsamples('github:eddyflux/wax'); */

let pat = note('c,eb,g,<bb c4 d4 eb4>')
  .s('sine')
  .press()
  .add(note(24))
  .fmi(3)
  .fmh(5.01)
  .dec(0.4)
  .delay('.6:<.12 .22>:.8')
  .jux(press)
  .rarely(add(note('12')))
  .lpf(400)
  .lpq(0.2)
  .lpd(0.4)
  .lpenv(3)
  .fmdecay(0.4)
  .fmenv(1)
  .postgain(0.6)
  .stack(s('<pink white>*8').dec(0.07).rarely(ply('2')).delay(0.5).hpf(sine.range(200, 2000).slow(4)).hpq(0.2))
  .stack(
    s('[- white@3]*2')
      .dec(0.4)
      .hpf('<2000!3 <4000 8000>>*4')
      .hpq(0.6)
      .ply('<1 2>*4')
      .postgain(0.5)
      .delay(0.5)
      .jux(rev)
      .lpf(5000),
  )
  .stack(
    note('<c2 - [- f1] ->*2')
      .s('square')
      .lpf(sine.range(100, 300).slow(4))
      .lpe(1)
      .segment(8)
      .lpd(0.3)
      .lpq(0.2)
      .dec(0.2)
      .speed('<1 2>')
      .ply('<1 2>')
      .postgain(1),
  )
  .stack(
    chord('<Cm Cm7 Cm9 Cm11 Fm Fm7 Fm9 Fm11>')
      .voicing()
      .s('<sine>')
      .clip(1)
      .rel(0.4)
      .vib('4:.2')
      .gain(0.7)
      .hpf(1200)
      .fm(0.5)
      .att(1)
      .lpa(0.5)
      .lpf(200)
      .lpenv(4)
      .chorus(0.8),
  )
  .slow(1 / cps);

let cycles = 30;
let seconds = cycles + 1; // 1s release tail
const haps = pat.queryArc(0, cycles);

const dough = new Dough(sampleRate);

console.log('spawn voices...');
haps.forEach((hap) => {
  hap.value._begin = Number(hap.whole.begin);
  hap.value._duration = hap.duration /*  / cps */;
  dough.scheduleSpawn(hap.value);
});
console.log(`render ${seconds}s long buffer, each dot is 1 second:`);
const buffers = [new Float32Array(seconds * sampleRate), new Float32Array(seconds * sampleRate)];
let t = performance.now();
while (dough.t <= buffers[0].length) {
  dough.update();
  buffers[0][dough.t] = dough.out[0];
  buffers[1][dough.t] = dough.out[1];
  if (dough.t % sampleRate === 0) {
    process.stdout.write('.');
  }
}
const took = (performance.now() - t) / 1000;
const load = (took / seconds) * 100;
const speed = (seconds / took).toFixed(2);
console.log('');
console.log(`done!
rendered ${seconds}s in ${took.toFixed(2)}s 
speed: ${speed}x
load: ${load.toFixed(2)}%`);

const patternAudio = {
  sampleRate,
  channelData: buffers,
};

WavEncoder.encode(patternAudio).then((buffer) => {
  fs.writeFileSync('pattern.wav', new Float32Array(buffer));
});
