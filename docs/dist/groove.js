import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
const Pattern = _Pattern;
Pattern.prototype.groove = function(groove) {
  return groove.fmap(() => (v) => v).appLeft(this);
};
Pattern.prototype.define("groove", (groove, pat) => pat.groove(groove), {composable: true});
