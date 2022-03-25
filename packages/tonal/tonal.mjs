import { Note, Interval, Scale } from '@tonaljs/tonal';
import { Pattern as _Pattern } from '@strudel/core/strudel.mjs';
import { mod } from '@strudel/core/util.mjs';

const Pattern = _Pattern; // as any;

// transpose note inside scale by offset steps
// function scaleTranspose(scale: string, offset: number, note: string) {
export function scaleTranspose(scale, offset, note) {
  let [tonic, scaleName] = Scale.tokenize(scale);
  let { notes } = Scale.get(`${tonic} ${scaleName}`);
  notes = notes.map((note) => Note.get(note).pc); // use only pc!
  offset = Number(offset);
  if (isNaN(offset)) {
    throw new Error(`scale offset "${offset}" not a number`);
  }
  const { pc: fromPc, oct = 3 } = Note.get(note);
  const noteIndex = notes.indexOf(fromPc);
  if (noteIndex === -1) {
    throw new Error(`note "${note}" is not in scale "${scale}"`);
  }
  let i = noteIndex,
    o = oct,
    n = fromPc;
  const direction = Math.sign(offset);
  // TODO: find way to do this smarter
  while (Math.abs(i - noteIndex) < Math.abs(offset)) {
    i += direction;
    const index = mod(i, notes.length);
    if (direction < 0 && n[0] === 'C') {
      o += direction;
    }
    n = notes[index];
    if (direction > 0 && n[0] === 'C') {
      o += direction;
    }
  }
  return n + o;
}

// Pattern.prototype._transpose = function (intervalOrSemitones: string | number) {
Pattern.prototype._transpose = function (intervalOrSemitones) {
  return this._withEvent((event) => {
    const interval = !isNaN(Number(intervalOrSemitones))
      ? Interval.fromSemitones(intervalOrSemitones /*  as number */)
      : String(intervalOrSemitones);
    if (typeof event.value === 'number') {
      const semitones = typeof interval === 'string' ? Interval.semitones(interval) || 0 : interval;
      return event.withValue(() => event.value + semitones);
    }
    // TODO: move simplify to player to preserve enharmonics
    // tone.js doesn't understand multiple sharps flats e.g. F##3 has to be turned into G3
    return event.withValue(() => Note.simplify(Note.transpose(event.value, interval)));
  });
};

// example: transpose(3).late(0.2) will be equivalent to compose(transpose(3), late(0.2))
// TODO: add Pattern.define(name, function, options) that handles all the meta programming stuff
// TODO: find out how to patternify this function when it's standalone
// e.g. `stack(c3).superimpose(transpose(slowcat(7, 5)))` or
// or even `stack(c3).superimpose(transpose.slowcat(7, 5))` or

Pattern.prototype._scaleTranspose = function (offset /* : number | string */) {
  return this._withEvent((event) => {
    if (!event.context.scale) {
      throw new Error('can only use scaleTranspose after .scale');
    }
    if (typeof event.value !== 'string') {
      throw new Error('can only use scaleTranspose with notes');
    }
    return event.withValue(() => scaleTranspose(event.context.scale, Number(offset), event.value));
  });
};
Pattern.prototype._scale = function (scale /* : string */) {
  return this._withEvent((event) => {
    let note = event.value;
    const asNumber = Number(note);
    if (!isNaN(asNumber)) {
      let [tonic, scaleName] = Scale.tokenize(scale);
      const { pc, oct = 3 } = Note.get(tonic);
      note = scaleTranspose(pc + ' ' + scaleName, asNumber, pc + oct);
    }
    return event.withValue(() => note).setContext({ ...event.context, scale });
  });
};

Pattern.prototype.define('transpose', (a, pat) => pat.transpose(a), { composable: true, patternified: true });
Pattern.prototype.define('scale', (a, pat) => pat.scale(a), { composable: true, patternified: true });
Pattern.prototype.define('scaleTranspose', (a, pat) => pat.scaleTranspose(a), { composable: true, patternified: true });
