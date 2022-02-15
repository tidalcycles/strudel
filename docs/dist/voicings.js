import {Pattern as _Pattern, stack, Hap, reify} from "../_snowpack/link/strudel.js";
import _voicings from "../_snowpack/pkg/chord-voicings.js";
const {dictionaryVoicing, minTopNoteDiff, lefthand} = _voicings;
const getVoicing = (chord, lastVoicing, range = ["F3", "A4"]) => dictionaryVoicing({
  chord,
  dictionary: lefthand,
  range,
  picker: minTopNoteDiff,
  lastVoicing
});
const Pattern = _Pattern;
Pattern.prototype.fmapNested = function(func) {
  return new Pattern((span) => this.query(span).map((event) => reify(func(event)).query(span).map((hap) => new Hap(event.whole, event.part, hap.value))).flat());
};
Pattern.prototype.voicings = function(range) {
  let lastVoicing;
  if (!range?.length) {
    range = ["F3", "A4"];
  }
  return this.fmapNested((event) => {
    lastVoicing = getVoicing(event.value, lastVoicing, range);
    return stack(...lastVoicing);
  });
};
Pattern.prototype.chordBass = function() {
  return this._mapNotes((value) => {
    console.log("value", value);
    const [_, root] = value.value.match(/^([a-gC-G])[b#]?.*$/);
    const bassNote = root + "2";
    return {...value, value: bassNote};
  });
};
Pattern.prototype.define("voicings", (range, pat) => pat.voicings(range), {composable: true});
Pattern.prototype.define("chordBass", (pat) => {
  console.log("call chordBass ...", pat);
  return pat.chordBass();
}, {composable: true});
