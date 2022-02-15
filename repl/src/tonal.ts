import { Note, Interval, Scale } from '@tonaljs/tonal';
import { Pattern as _Pattern, curry, makeComposable } from '../../strudel.mjs';

const Pattern = _Pattern as any;

export declare interface NoteEvent {
  value: string;
  scale?: string;
}

function toNoteEvent(event: string | NoteEvent): NoteEvent {
  if (typeof event === 'string') {
    return { value: event };
  }
  if (event.value) {
    return event;
  }
  throw new Error('not a valid note event: ' + JSON.stringify(event));
}

// modulo that works with negative numbers e.g. mod(-1, 3) = 2
const mod = (n: number, m: number): number => (n < 0 ? mod(n + m, m) : n % m);

export function intervalDirection(from, to, direction = 1) {
  const sign = Math.sign(direction);
  const interval = sign < 0 ? Interval.distance(to, from) : Interval.distance(from, to);
  return (sign < 0 ? '-' : '') + interval;
}

// transpose note inside scale by offset steps
function scaleTranspose(scale: string, offset: number, note: string) {
  let [tonic, scaleName] = Scale.tokenize(scale);
  const { notes } = Scale.get(`${tonic} ${scaleName}`);
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
    if (direction < 0 && n === 'C') {
      o += direction;
    }
    n = notes[index];
    if (direction > 0 && n === 'C') {
      o += direction;
    }
  }
  return n + o;
}

Pattern.prototype._mapNotes = function (func: (note: NoteEvent) => NoteEvent) {
  return this.fmap((event: string | NoteEvent) => {
    const noteEvent = toNoteEvent(event);
    return func(noteEvent);
  });
};

Pattern.prototype._transpose = function (intervalOrSemitones: string | number) {
  return this._mapNotes(({ value, scale }: NoteEvent) => {
    const interval = !isNaN(Number(intervalOrSemitones))
      ? Interval.fromSemitones(intervalOrSemitones as number)
      : String(intervalOrSemitones);
    return { value: Note.transpose(value, interval), scale };
  });
};

// example: transpose(3).late(0.2) will be equivalent to compose(transpose(3), late(0.2))
export const transpose = curry(
  (a, pat) => pat.transpose(a),
  (partial) => makeComposable(partial)
);
// TODO: add Pattern.define(name, function, options) that handles all the meta programming stuff
// TODO: find out how to patternify this function when it's standalone
// e.g. `stack(c3).superimpose(transpose(slowcat(7, 5)))` or
// or even `stack(c3).superimpose(transpose.slowcat(7, 5))` or

Pattern.prototype._scaleTranspose = function (offset: number | string) {
  return this._mapNotes(({ value, scale }: NoteEvent) => {
    if (!scale) {
      throw new Error('can only use scaleOffset after .scale');
    }
    return { value: scaleTranspose(scale, Number(offset), value), scale };
  });
};
Pattern.prototype._scale = function (scale: string) {
  return this._mapNotes((value) => ({ ...value, scale }));
};

Pattern.prototype.patternified = Pattern.prototype.patternified.concat(['transpose', 'scaleTranspose', 'scale']);
Object.assign(Pattern.prototype.composable, { transpose });
