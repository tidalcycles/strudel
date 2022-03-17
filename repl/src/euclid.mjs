import { Pattern } from '../../strudel.mjs';
import bjork from 'bjork';
import { rotate } from '../../util.mjs';

const euclid = (pulses, steps, rotation = 0) => {
  const b = bjork(steps, pulses);
  if (rotation) {
    return rotate(b, -rotation);
  }
  return b;
};

Pattern.prototype.euclid = function (pulses, steps, rotation = 0) {
  return this.struct(euclid(pulses, steps, rotation));
};

export default euclid;
