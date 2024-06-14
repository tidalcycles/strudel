import { Invoke } from './utils.mjs';
import { Pattern, getEventOffsetMs, noteToMidi } from '@strudel/core';

const ON_MESSAGE = 0x90;
const OFF_MESSAGE = 0x80;
const CC_MESSAGE = 0xb0;

Pattern.prototype.midi = function (output) {
  return this.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    let { note, nrpnn, nrpv, ccn, ccv, velocity = 0.9, gain = 1 } = hap.value;
    //magic number to get audio engine to line up, can probably be calculated somehow
    const latencyMs = 34;
    const offset = getEventOffsetMs(targetTime, currentTime) + latencyMs;
    velocity = Math.floor(gain * velocity * 100);
    const duration = Math.floor((hap.duration.valueOf() / cps) * 1000 - 10);
    const roundedOffset = Math.round(offset);
    const midichan = (hap.value.midichan ?? 1) - 1;
    const requestedport = output ?? 'IAC';
    const messagesfromjs = [];
    if (note != null) {
      const midiNumber = typeof note === 'number' ? note : noteToMidi(note);
      messagesfromjs.push({
        requestedport,
        message: [ON_MESSAGE + midichan, midiNumber, velocity],
        offset: roundedOffset,
      });
      messagesfromjs.push({
        requestedport,
        message: [OFF_MESSAGE + midichan, midiNumber, velocity],
        offset: roundedOffset + duration,
      });
    }
    if (ccv && ccn) {
      if (typeof ccv !== 'number' || ccv < 0 || ccv > 1) {
        throw new Error('expected ccv to be a number between 0 and 1');
      }
      if (!['string', 'number'].includes(typeof ccn)) {
        throw new Error('expected ccn to be a number or a string');
      }
      const scaled = Math.round(ccv * 127);
      messagesfromjs.push({
        requestedport,
        message: [CC_MESSAGE + midichan, ccn, scaled],
        offset: roundedOffset,
      });
    }
    // invoke is temporarily blocking, run in an async process
    if (messagesfromjs.length) {
      setTimeout(() => {
        Invoke('sendmidi', { messagesfromjs });
      });
    }
  });
};
