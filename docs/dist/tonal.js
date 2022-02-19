import {Note, Interval, Scale} from "../_snowpack/pkg/@tonaljs/tonal.js";
import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
const Pattern = _Pattern;
function toNoteEvent(event) {
  if (typeof event === "string") {
    return {value: event};
  }
  if (event.value) {
    return event;
  }
  throw new Error("not a valid note event: " + JSON.stringify(event));
}
const mod = (n, m) => n < 0 ? mod(n + m, m) : n % m;
export function intervalDirection(from, to, direction = 1) {
  const sign = Math.sign(direction);
  const interval = sign < 0 ? Interval.distance(to, from) : Interval.distance(from, to);
  return (sign < 0 ? "-" : "") + interval;
}
function scaleTranspose(scale, offset, note) {
  let [tonic, scaleName] = Scale.tokenize(scale);
  let {notes} = Scale.get(`${tonic} ${scaleName}`);
  notes = notes.map((note2) => Note.get(note2).pc);
  offset = Number(offset);
  if (isNaN(offset)) {
    throw new Error(`scale offset "${offset}" not a number`);
  }
  const {pc: fromPc, oct = 3} = Note.get(note);
  const noteIndex = notes.indexOf(fromPc);
  if (noteIndex === -1) {
    throw new Error(`note "${note}" is not in scale "${scale}"`);
  }
  let i = noteIndex, o = oct, n = fromPc;
  const direction = Math.sign(offset);
  while (Math.abs(i - noteIndex) < Math.abs(offset)) {
    i += direction;
    const index = mod(i, notes.length);
    if (direction < 0 && n === "C") {
      o += direction;
    }
    n = notes[index];
    if (direction > 0 && n === "C") {
      o += direction;
    }
  }
  return n + o;
}
Pattern.prototype._mapNotes = function(func) {
  return this.fmap((event) => {
    const noteEvent = toNoteEvent(event);
    return {...noteEvent, ...func(noteEvent)};
  });
};
Pattern.prototype._transpose = function(intervalOrSemitones) {
  return this._mapNotes(({value, scale}) => {
    const interval = !isNaN(Number(intervalOrSemitones)) ? Interval.fromSemitones(intervalOrSemitones) : String(intervalOrSemitones);
    return {value: Note.transpose(value, interval), scale};
  });
};
Pattern.prototype._scaleTranspose = function(offset) {
  return this._mapNotes(({value, scale}) => {
    if (!scale) {
      throw new Error("can only use scaleOffset after .scale");
    }
    return {value: scaleTranspose(scale, Number(offset), value), scale};
  });
};
Pattern.prototype._scale = function(scale) {
  return this._mapNotes((value) => {
    let note = value.value;
    const asNumber = Number(note);
    if (!isNaN(asNumber)) {
      let [tonic, scaleName] = Scale.tokenize(scale);
      const {pc, oct = 3} = Note.get(tonic);
      note = scaleTranspose(pc + " " + scaleName, asNumber, pc + oct);
    }
    return {...value, value: note, scale};
  });
};
Pattern.prototype.define("transpose", (a, pat) => pat.transpose(a), {composable: true, patternified: true});
Pattern.prototype.define("scale", (a, pat) => pat.scale(a), {composable: true, patternified: true});
Pattern.prototype.define("scaleTranspose", (a, pat) => pat.scaleTranspose(a), {composable: true, patternified: true});
