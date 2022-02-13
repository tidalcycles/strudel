import { Note, Interval } from '@tonaljs/tonal';
import { Pattern as _Pattern } from '../../strudel.mjs';

const Pattern = _Pattern as any;

Pattern.prototype._transpose = function (intervalOrSemitones: string | number) {
  const interval = !isNaN(Number(intervalOrSemitones))
    ? Interval.fromSemitones(intervalOrSemitones as number)
    : String(intervalOrSemitones);
  return this.fmap((note) => Note.transpose(note, interval));
};

Pattern.prototype.transpose = function (intervalOrSemitones: string | number) {
  return this._patternify(Pattern.prototype._transpose)(intervalOrSemitones);
};
