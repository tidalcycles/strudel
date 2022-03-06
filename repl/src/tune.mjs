import Tune from './tunejs.js';
import { Pattern } from '../../strudel.mjs';

Pattern.prototype._tune = function (scale, tonic = 220) {
  const tune = new Tune();
  if (!tune.isValidScale(scale)) {
    throw new Error('not a valid tune.js scale name: "' + scale + '". See http://abbernie.github.io/tune/scales.html');
  }
  tune.loadScale(scale);
  tune.tonicize(tonic);
  return this._asNumber()._withEvent((event) => {
    return event.withValue(() => tune.note(event.value)).setContext({ ...event.context, type: 'frequency' });
  });
};

Pattern.prototype.define('tune', (scale, pat) => pat.tune(scale), { composable: true, patternified: true });
