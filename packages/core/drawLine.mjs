import Fraction, { gcd } from './fraction.mjs';

function drawLine(pat, chars = 60) {
  let cycle = 0;
  let pos = Fraction(0);
  let lines = [''];
  let emptyLine = ''; // this will be the "reference" empty line, which will be copied into extra lines
  while (lines[0].length < chars) {
    const haps = pat.queryArc(cycle, cycle + 1);
    const durations = haps.filter((hap) => hap.hasOnset()).map((hap) => hap.duration);
    const charFraction = gcd(...durations);
    const totalSlots = charFraction.inverse(); // number of character slots for the current cycle
    lines = lines.map((line) => line + '|'); // add pipe character before each cycle
    emptyLine += '|';
    for (let i = 0; i < totalSlots; i++) {
      const [begin, end] = [pos, pos.add(charFraction)];
      const matches = haps.filter((hap) => hap.whole.begin.lte(begin) && hap.whole.end.gte(end));
      const missingLines = matches.length - lines.length;
      if (missingLines > 0) {
        lines = lines.concat(Array(missingLines).fill(emptyLine));
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
      emptyLine += '.';
      pos = pos.add(charFraction);
    }
    cycle++;
  }
  return lines.join('\n');
}

export default drawLine;
