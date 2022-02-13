import { Pattern as _Pattern, stack, TimeSpan, Hap, reify } from '../../strudel.mjs';
import voicings from 'chord-voicings';
const { dictionaryVoicing, minTopNoteDiff, lefthand } = voicings;

const getVoicing = (chord, lastVoicing, range = ['F3', 'A4']) =>
  dictionaryVoicing({
    chord,
    dictionary: lefthand,
    range,
    picker: minTopNoteDiff,
    lastVoicing,
  });

const Pattern = _Pattern as any;

Pattern.prototype.fmapNested = function (func) {
  return new Pattern((span) =>
    this.query(span)
      .map((event) =>
        reify(func(event))
          .query(span)
          .map((hap) => new Hap(event.whole, event.part, hap.value))
      )
      .flat()
  );
};

Pattern.prototype.voicings = function (range = ['F3', 'A4']) {
  let lastVoicing;
  return this.fmapNested((event) => {
    lastVoicing = getVoicing(event.value, lastVoicing, range);
    return stack(...lastVoicing);
  });
};
