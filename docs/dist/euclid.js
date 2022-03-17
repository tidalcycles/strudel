import {Pattern} from "../_snowpack/link/strudel.js";
import bjork from "../_snowpack/pkg/bjork.js";
import {rotate} from "../_snowpack/link/util.js";
const euclid = (pulses, steps, rotation = 0) => {
  const b = bjork(steps, pulses);
  if (rotation) {
    return rotate(b, -rotation);
  }
  return b;
};
Pattern.prototype.euclid = function(pulses, steps, rotation = 0) {
  return this.struct(euclid(pulses, steps, rotation));
};
export default euclid;
