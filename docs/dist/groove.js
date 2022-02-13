import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
const Pattern = _Pattern;
Pattern.prototype.groove = function(groove) {
  return groove.fmap(() => (v) => v).appLeft(this);
};
