import { Pattern as _Pattern } from '../../strudel.mjs';

const Pattern = _Pattern as any;

// is this the same as struct?
Pattern.prototype.groove = function (groove) {
  return groove.fmap(() => (v) => v).appLeft(this);
};
