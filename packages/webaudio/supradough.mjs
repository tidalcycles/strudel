import { Pattern } from '@strudel/core';
import { connectToDestination, destroyAudioWorkletNode, getAudioContext, webAudioTimeout } from 'superdough';
Pattern.prototype.supradough = function () {
  return this.onTrigger((_, hap, __, cps, begin) => {
    const { value } = hap;
    value.freq = getFrequencyFromValue(hap.value);
    const ac = getAudioContext();

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
    value._holdEnd = holdEnd

    let o = getWorklet(
      ac,
      'dough-processor',
      {},
      {
        outputChannelCount: [2],
      },
    );

    o.port.postMessage(value); // send value to worklet
    webAudioTimeout(ac, () => destroyAudioWorkletNode(o), begin, end);
    connectToDestination(o); // channels?
  }, 1);
};
