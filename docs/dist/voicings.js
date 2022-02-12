import {Pattern as _Pattern, stack, Hap, reify} from "../_snowpack/link/strudel.js";
import voicings from "../_snowpack/pkg/chord-voicings.js";
const {dictionaryVoicing, minTopNoteDiff, lefthand} = voicings;
const getVoicing = (chord, lastVoicing, range = ["F3", "A4"]) => dictionaryVoicing({
  chord,
  dictionary: lefthand,
  range,
  picker: minTopNoteDiff,
  lastVoicing
});
const Pattern = _Pattern;
Pattern.prototype.fmapNested = function(func) {
  return new Pattern((span) => this.query(span).map((event) => {
    return reify(func(event)).query(span).map((hap) => new Hap(event.whole, event.part, hap.value));
  }).flat());
};
Pattern.prototype.voicings = function(range = ["F3", "A4"]) {
  let lastVoicing;
  return this.fmapNested((event) => {
    lastVoicing = getVoicing(event.value, lastVoicing, range);
    return stack(...lastVoicing);
  });
};
