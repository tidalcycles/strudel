import { gcd } from './fraction.mjs';

// TODO: make it work for stacked patterns + support silence

function drawLine(pat, chars = 60) {
  let s = '';
  let c = 0;
  while (s.length < chars) {
    const haps = pat.queryArc(c, c + 1);
    const durations = haps.map((hap) => hap.duration);
    const totalSlots = gcd(...durations).inverse();
    s += '|';
    haps.forEach((hap) => {
      const duration = hap.whole.end.sub(hap.whole.begin);
      const slots = totalSlots.mul(duration);
      s += Array(slots.valueOf())
        .fill()
        .map((_, i) => (!i ? hap.value : '-'))
        .join('');
    });
    ++c;
  }
  return s;
}

export default drawLine;
