import { gcd } from './fraction.mjs';

function drawLine(pat) {
  let s = '';
  let c = 0;
  while (s.length < 60) {
    const haps = pat.queryArc(c, c + 1);
    const durations = haps.map((hap) => hap.duration);
    const totalSlots = gcd(...durations).inverse();
    haps.forEach((hap) => {
      const duration = hap.whole.end.sub(hap.whole.begin);
      const slots = totalSlots.mul(duration);
      s += Array(slots.valueOf())
        .fill()
        .map((_, i) => (!i ? hap.value : '-'))
        .join('');
    });
    s += '|';
    ++c;
  }
  return s;
}

export default drawLine;
