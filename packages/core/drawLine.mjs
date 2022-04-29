/*
drawLine.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/drawLine.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
