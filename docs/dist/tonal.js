import {Note, Interval, Scale} from "../_snowpack/pkg/@tonaljs/tonal.js";
import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
const Pattern = _Pattern;
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
Pattern.prototype._transpose = function(intervalOrSemitones) {
  return this._withEvent((event) => {
    const interval = !isNaN(Number(intervalOrSemitones)) ? Interval.fromSemitones(intervalOrSemitones) : String(intervalOrSemitones);
    if (typeof event.value === "number") {
      const semitones = typeof interval === "string" ? Interval.semitones(interval) || 0 : interval;
      return event.withValue(() => event.value + semitones);
    }
    return event.withValue(() => Note.transpose(event.value, interval));
  });
};
Pattern.prototype._scaleTranspose = function(offset) {
  return this._withEvent((event) => {
    if (!event.context.scale) {
      throw new Error("can only use scaleTranspose after .scale");
    }
    if (typeof event.value !== "string") {
      throw new Error("can only use scaleTranspose with notes");
    }
    return event.withValue(() => scaleTranspose(event.context.scale, Number(offset), event.value));
  });
};
Pattern.prototype._scale = function(scale) {
  return this._withEvent((event) => {
    let note = event.value;
    const asNumber = Number(note);
    if (!isNaN(asNumber)) {
      let [tonic, scaleName] = Scale.tokenize(scale);
      const {pc, oct = 3} = Note.get(tonic);
      note = scaleTranspose(pc + " " + scaleName, asNumber, pc + oct);
    }
    return event.withValue(() => note).setContext({...event.context, scale});
  });
};
Pattern.prototype.define("transpose", (a, pat) => pat.transpose(a), {composable: true, patternified: true});
Pattern.prototype.define("scale", (a, pat) => pat.scale(a), {composable: true, patternified: true});
Pattern.prototype.define("scaleTranspose", (a, pat) => pat.scaleTranspose(a), {composable: true, patternified: true});
