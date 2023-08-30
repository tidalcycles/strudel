import { Invoke } from './utils.mjs';
import { noteToMidi } from '@strudel.cycles/core';

const ON_MESSAGE = 0x90;
const OFF_MESSAGE = 0x80;

export function processMidi(output) {
  return this.onTrigger((time, hap, currentTime) => {
    const { note, nrpnn, nrpv, ccn, ccv } = hap.value;
    const offset = (time - currentTime) * 1000;
    const velocity = Math.floor((hap.context?.velocity ?? 0.9) * 100); // TODO: refactor velocity
    const duration = Math.floor(hap.duration.valueOf() * 1000 - 10);
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
        message: [ON_MESSAGE + midichan, ccn, scaled],
        offset: roundedOffset,
      });
      messagesfromjs.push({
        requestedport,
        message: [OFF_MESSAGE + midichan, ccn, scaled],
        offset: roundedOffset + duration,
      });
    }
    // invoke is temporarily blocking, run in an async process
    if (messagesfromjs.length) {
      setTimeout(() => {
        Invoke('sendmidi', { messagesfromjs });
      });
    }
  });
}
