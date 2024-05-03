import { createClock, evalScope } from '@strudel/core';
import { evaluate } from '@strudel/transpiler';
import watch from 'node-watch';
import fs from 'node:fs/promises';
import { AudioContext, OscillatorNode, GainNode } from 'node-web-audio-api';

const audioContext = new AudioContext();

let file = 'pattern.mjs';
let pattern;
async function evaluateFile() {
  try {
    console.log('// file evaluated:');
    const code = await fs.readFile(file, { encoding: 'utf8' });
    console.log(code);
    const res = await evaluate(code);
    pattern = res.pattern;
  } catch (err) {
    console.error(err);
  }
}

// const getTime = () => performance.now() / 1000;
const getTime = () => audioContext.currentTime;
let minLatency = 50;
async function main() {
  await evalScope(import('@strudel/core'), import('@strudel/mini'), import('@strudel/tonal'));
  await evaluateFile();
  watch(file, { recursive: true }, () => evaluateFile());
  let lastEnd;
  const clock = createClock(getTime, (phase) => {
    if (!lastEnd) {
      lastEnd = phase;
      return;
    }
    const haps = pattern.queryArc(lastEnd, phase);
    lastEnd = phase;
    const cps = 1;
    const cycle = Math.floor(phase);
    haps
      .filter((h) => h.hasOnset())
      .forEach((hap) => {
        const env = new GainNode(audioContext, { gain: 0 });
        const { attack = 0.01, gain = 1 } = hap.value;
        env.connect(audioContext.destination);
        const now = hap.whole.begin;
        const duration = hap.duration;
        env.gain
          .setValueAtTime(0, now)
          .linearRampToValueAtTime(gain * 0.2, now + attack)
          .exponentialRampToValueAtTime(0.0001, now + duration);
        const frequency = hap.value.freq;

        const osc = new OscillatorNode(audioContext, { frequency });
        osc.connect(env);
        osc.start(now);
        osc.stop(now + duration);
      });
  });

  clock.start();
}

main();
