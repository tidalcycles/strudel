import { Pattern } from '@strudel.cycles/core';
import Glicol from 'glicol';

const glicol = new Glicol();

// TODO: make sure SharedArrayBuffer is working

Pattern.prototype.glicol = function () {
  return this._withEvent((event) => {
    const onTrigger = (time, event) => {
      const freq = getFrequency(event);
      const amp = event.context.velocity ?? 0.9;
      glicol.run(`o: sin ${freq} >> mul ${amp}`);
      // TODO
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};

function getFrequency(event) {
  let { value } = event;
  if (typeof value === 'string') {
    if (!isNote(value)) {
      throw new Error('cannot get frequency of: ' + value);
    }
    value = toMidi(value);
  }
  if (typeof value !== 'number') {
    throw new Error('cannot get frequency of: ' + value);
  }
  return fromMidi(value);
}
