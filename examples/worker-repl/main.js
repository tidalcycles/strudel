import { createClock, seq } from '@strudel/core';
import { getAudioContext, initAudioOnFirstClick, samples, superdough } from 'superdough';
import { setInterval, clearInterval } from 'worker-timers'; // comment out this line to test with window.setInterval

let loaded = samples('github:tidalcycles/dirt-samples');
async function run() {
  // let pat = seq('hh').s().fast(25.2);
  let pat = seq('bd', ['hh', 'hh'], 'jvbass').s().fast(1.92);
  await initAudioOnFirstClick();
  await loaded;
  const ctx = getAudioContext();
  let last = 0;
  const clock = createClock(
    () => ctx.currentTime,
    (phase, duration, tick, t) => {
      const [begin, end] = [last, (last = tick * duration)];
      console.log('q', begin.toFixed(2), end.toFixed(2), phase.toFixed(2));
      let haps = pat.queryArc(begin, end).filter((h) => h.hasOnset());
      // console.log('phase', phase, haps.length);
      haps.forEach((hap) => {
        superdough(hap.value, '=' + String(hap.whole.begin + 0.1));
      });
    },
    0.025, // duration of each cycle
    0.1, // interval between callbacks
    0.4, // overlap between callbacks
    setInterval,
    clearInterval,
    false,
  );
  clock.start();
}

run();
