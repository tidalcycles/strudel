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
  connectToDestination(doughWorklet); // channels?
}

Pattern.prototype.supradough = function () {
  return this.onTrigger((_, hap, __, cps, begin) => {
    hap.value._begin = begin;
    hap.value._duration = hap.duration / cps;

    if (!doughWorklet) {
      initDoughWorklet();
    }
    doughWorklet.port.postMessage(hap.value);
  }, 1);
};
