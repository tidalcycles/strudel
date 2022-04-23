import { gcd } from './fraction.mjs';

function drawLine(pat, chars = 60) {
  let c = 0;
  let lines = [''];
  const slots = [];
  while (lines[0].length < chars) {
    const haps = pat.queryArc(c, c + 1);
    const durations = haps.filter((hap) => hap.hasOnset()).map((hap) => hap.duration);
    const totalSlots = gcd(...durations).inverse();
    slots.push(totalSlots);
    const minDuration = durations.reduce((a, b) => a.min(b), durations[0]);
    lines = lines.map((line) => line + '|');

    for (let i = 0; i < totalSlots; i++) {
      const step = c * totalSlots + i;
      const [begin, end] = [minDuration.mul(step), minDuration.mul(step + 1)];
      const matches = haps.filter((hap) => hap.whole.begin.lte(begin) && hap.whole.end.gte(end));
      const missingLines = matches.length - lines.length;
      if (missingLines > 0) {
        console.log(c, 'missingLines', missingLines);
        const emptyCycles =
          '|' +
          new Array(c)
            .fill()
            .map((_, l) => Array(slots[l]).fill('.').join(''))
            .join('|') +
          Array(i).fill('.').join('');
        lines = lines.concat(Array(missingLines).fill(emptyCycles));
      }
      lines = lines.map((line, i) => {
        const hap = matches[i];
        if (hap) {
          const isOnset = hap.whole.begin.eq(begin);
          const char = isOnset ? '' + hap.value : '-';
          return line + char;
        }
        return line + '.';
      });
    }
    c++;
  }
  return lines.join('\n');
}

export default drawLine;
