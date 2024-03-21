import { createClock, seq } from '@strudel/core';
import { getAudioContext, initAudioOnFirstClick, samples, superdough } from 'superdough';
import { setInterval, clearInterval } from 'worker-timers'; // comment out this line to test with window.setInterval

let loaded = samples('github:tidalcycles/dirt-samples');
async function run() {
  //let pat = seq('hh').s().fast(25.2);
  let pat = seq('bd', ['hh', 'hh'], 'jvbass').s().fast(1.92);
  await initAudioOnFirstClick();
  await loaded;
  const ctx = getAudioContext();
  let last = 0;
  let cps = 0.6;
  let num_ticks_since_cps_change = 0;
  let num_cycles_at_cps_change = 0;
  let seconds_at_cps_change;
  let latency = 0.1;

  function setCps(_cps) {
    if (_cps === cps) {
      return;
    }
    cps = _cps;
    num_ticks_since_cps_change = 0;
  }

  const clock = createClock(
    () => ctx.currentTime,
    (phase, duration, tick, t) => {
      if (num_ticks_since_cps_change === 0) {
        console.log('changed cps..!!', cps);
        num_cycles_at_cps_change = last;
        seconds_at_cps_change = phase;
      }
      num_ticks_since_cps_change++;
      const seconds_since_cps_change = num_ticks_since_cps_change * duration;
      const num_cycles_since_cps_change = seconds_since_cps_change * cps;

      const [begin, end] = [last, (last = num_cycles_at_cps_change + num_cycles_since_cps_change)];

      console.log(
        'q',
        begin.toFixed(2),
        end.toFixed(2),
        phase.toFixed(2),
        '#',
        (end - begin).toFixed(2),
        duration.toFixed(2),
      );

      pat
        .queryArc(begin, end, { _cps: cps })
        .filter((h) => h.hasOnset())
        .forEach((hap) => {
          const deadline = (hap.whole.begin - num_cycles_at_cps_change) / cps + seconds_at_cps_change + latency;
          superdough(hap.value, '=' + deadline);
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
  setTimeout(() => {
    console.log('change cps!!!!!!!!!!!!!!!!!!!!');
    setCps(1.2);
  }, 6000);
  setTimeout(() => {
    clock.stop();
  }, 12000);
}

run();
