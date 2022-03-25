import { Pattern as _Pattern, stack, Hap, reify } from '@strudel/core/strudel.mjs';
import _voicings from 'chord-voicings';
const { dictionaryVoicing, minTopNoteDiff, lefthand } = _voicings.default;

const getVoicing = (chord, lastVoicing, range = ['F3', 'A4']) =>
  dictionaryVoicing({
    chord,
    dictionary: lefthand,
    range,
    picker: minTopNoteDiff,
    lastVoicing,
  });

const Pattern = _Pattern;

Pattern.prototype.fmapNested = function (func) {
  return new Pattern((span) =>
    this.query(span)
      .map((event) =>
        reify(func(event))
          .query(span)
          .map((hap) => new Hap(event.whole, event.part, hap.value, hap.context)),
      )
      .flat(),
  );
};

Pattern.prototype.voicings = function (range) {
  let lastVoicing;
  if (!range?.length) {
    // allows to pass empty array, if too lazy to specify range
    range = ['F3', 'A4'];
  }
  return this.fmapNested((event) => {
    lastVoicing = getVoicing(event.value, lastVoicing, range);
    return stack(...lastVoicing)._withContext(() => ({
      locations: event.context.locations || [],
    }));
  });
};

Pattern.prototype._rootNotes = function (octave = 2) {
  return this.fmap((value) => {
    const [_, root] = value.match(/^([a-gA-G][b#]?).*$/);
    return root + octave;
  });
};

Pattern.prototype.define('voicings', (range, pat) => pat.voicings(range), { composable: true });
Pattern.prototype.define('rootNotes', (oct, pat) => pat.rootNotes(oct), { composable: true, patternified: true });
