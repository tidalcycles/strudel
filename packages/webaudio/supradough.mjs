import { Pattern } from '@strudel/core';
import { connectToDestination, getAudioContext, getWorklet } from 'superdough';

let doughWorklet;

function initDoughWorklet() {
  const ac = getAudioContext();
  doughWorklet = getWorklet(
    ac,
    'dough-processor',
    {},
    {
      outputChannelCount: [2],
    },
  );
  /* webAudioTimeout(ac, () => destroyAudioWorkletNode(doughWorklet), begin, end); */
  connectToDestination(doughWorklet); // channels?
}

Pattern.prototype.supradough = function () {
  return this.onTrigger((_, hap, __, cps, begin) => {
    const { value } = hap;
    // todo: could these calculations be made inside dough as well?
    value.freq = getFrequencyFromValue(hap.value);

    const release = getADSRValues(
      [value.attack, value.decay, value.sustain, value.release],
      'linear',
      [0.001, 0.05, 0.6, 0.01],
    )[3];

    const duration = hap.duration / cps;
    const holdEnd = begin + duration;
    const end = holdEnd + release + 0.01;
    value._begin = begin; // these are needed for the gate signal
    value._end = end;
    value._holdEnd = holdEnd;
    value._holdDuration = duration + release;

    if (!doughWorklet) {
      initDoughWorklet();
    }
    doughWorklet.port.postMessage(value);
  }, 1);
};
