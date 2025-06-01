import { Pattern } from '@strudel/core';
import { connectToDestination, destroyAudioWorkletNode, getAudioContext } from 'superdough';

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
    const holdend = begin + duration;
    const end = holdend + release + 0.01;
    value._begin = begin; // these are needed for the gate signal
    value._end = end;

    let o = getWorklet(
      ac,
      'dough-processor',
      {
        begin, // we might not need these, as we could send them via postMessage below
        end,
      },
      {
        outputChannelCount: [2],
      },
    );

    o.port.postMessage(value); // send value to worklet
    let timeoutNode = webAudioTimeout(ac, () => destroyAudioWorkletNode(o), begin, end);
    timeoutNode.stop(end + 0.125);
    connectToDestination(o); // channels?
  }, 1);
};
