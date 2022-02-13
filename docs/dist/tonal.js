import {Note, Interval} from "../_snowpack/pkg/@tonaljs/tonal.js";
import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
const Pattern = _Pattern;
Pattern.prototype._transpose = function(intervalOrSemitones) {
  const interval = !isNaN(Number(intervalOrSemitones)) ? Interval.fromSemitones(intervalOrSemitones) : String(intervalOrSemitones);
  return this.fmap((note) => Note.transpose(note, interval));
};
Pattern.prototype.transpose = function(intervalOrSemitones) {
  return this._patternify(Pattern.prototype._transpose)(intervalOrSemitones);
};
