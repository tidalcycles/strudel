import { evaluate } from '@strudel.cycles/transpiler';
import { evalScope, controls, getFrequency } from '@strudel.cycles/core';
import { AudioContext, OscillatorNode, GainNode } from 'node-web-audio-api';
import abletonlink from 'abletonlink';

//// prepare pattern

await evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  // import('@strudel.cycles/xen'),
  // import('@strudel.cycles/osc'),
);

const { pattern } = await evaluate(
  `note("<Dm7 G7 C^7!2>".voicings('lefthand')).ply(8).gain(.0625).s('sawtooth').early(.06)`,
);

//// web audio logic

const ac = new AudioContext();

export function playHaps(haps, beat, cps = 1) {
  const ct = ac.currentTime;
  haps
    .filter((hap) => hap.hasOnset())
    .forEach((hap) => {
      const deadline = (hap.whole.begin - beat) / cps;
      const t = ct + deadline;
      const freq = getFrequency(hap) ?? 220;
      const { gain = 1, s = 'triangle' } = hap.value;

      const env = new GainNode(ac);
      env.connect(ac.destination);
      env.gain.value = 0;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(gain, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + hap.duration);

      const osc = new OscillatorNode(ac);
      osc.frequency.value = freq;
      osc.type = s;
      osc.connect(env);
      osc.start(t);
      osc.stop(t + hap.duration);
    });
}

//// link scheduling

const link = new abletonlink();

let lastBeat;
link.startUpdate(60, (beat, phase, bpm) => {
  if (lastBeat !== undefined) {
    const cps = bpm / 60;
    const haps = pattern.slow(2).queryArc(lastBeat, beat);
    playHaps(haps, lastBeat, cps);
  }
  lastBeat = beat;
});
