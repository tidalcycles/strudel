/*
euclid.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/euclid.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, timeCat } from './pattern.mjs';
import bjork from 'bjork';
import { rotate } from './util.mjs';
import Fraction from './fraction.mjs';

const euclid = (pulses, steps, rotation = 0) => {
  const b = bjork(steps, pulses);
  if (rotation) {
    return rotate(b, -rotation);
  }
  return b;
};

/**
 * Changes the structure of the pattern to form an euclidean rhythm.
 * Euclidian rhythms are rhythms obtained using the greatest common divisor of two numbers.
 * They were described in 2004 by Godfried Toussaint, a canadian computer scientist.
 * Euclidian rhythms are really useful for computer/algorithmic music because they can accurately
 * describe a large number of rhythms used in the most important music world traditions.
 *
 * @param {number} pulses the number of onsets / beats
 * @param {number} steps the number of steps to fill
 * @param {number} rotation (optional) offset in steps
 * @returns Pattern
 * @example // The Cuban tresillo pattern.
 * "c3".euclid(3,8)
 * @example // A thirteenth century Persian rhythm called Khafif-e-ramal.
 * "c3".euclid(2,5)
 * @example // The archetypal pattern of the Cumbia from Colombia, as well as a Calypso rhythm from Trinidad.
 * "c3".euclid(3,4)
 * @example // Another thirteenth century Persian rhythm by the name of Khafif-e-ramal, as well as a Rumanian folk-dance rhythm.
 * "c3".euclid(3,5,2)
 * @example // A Ruchenitza rhythm used in a Bulgarian folk-dance.
 * "c3".euclid(3,7)
 * @example // The Cuban tresillo pattern.
 * "c3".euclid(3,8)
 * @example // Another Ruchenitza Bulgarian folk-dance rhythm.
 * "c3".euclid(4,7)
 * @example // The Aksak rhythm of Turkey.
 * "c3".euclid(4,9)
 * @example // The metric pattern used by Frank Zappa in his piece titled Outside Now.
 * "c3".euclid(4,11)
 * @example // Yields the York-Samai pattern, a popular Arab rhythm.
 * "c3".euclid(5,6)
 * @example // The Nawakhat pattern, another popular Arab rhythm.
 * "c3".euclid(5,7)
 * @example // The Cuban cinquillo pattern.
 * "c3".euclid(5,8)
 * @example // A popular Arab rhythm called Agsag-Samai.
 * "c3".euclid(5,9)
 * @example // The metric pattern used by Moussorgsky in Pictures at an Exhibition.
 * "c3".euclid(5,11)
 * @example // The Venda clapping pattern of a South African children’s song.
 * "c3".euclid(5,12)
 * @example // The Bossa-Nova rhythm necklace of Brazil.
 * "c3".euclid(5,16)
 * @example // A typical rhythm played on the Bendir (frame drum).
 * "c3".euclid(7,8)
 * @example // A common West African bell pattern.
 * "c3".euclid(7,12)
 * @example // A Samba rhythm necklace from Brazil.
 * "c3".euclid(7,16,14)
 * @example // A rhythm necklace used in the Central African Republic.
 * "c3".euclid(9,16)
 * @example // A rhythm necklace of the Aka Pygmies of Central Africa.
 * "c3".euclid(11,24,14)
 * @example // Another rhythm necklace of the Aka Pygmies of the upper Sangha.
 * "c3".euclid(13,24,5)
 */
Pattern.prototype.euclid = function (pulses, steps, rotation = 0) {
  return this.struct(euclid(pulses, steps, rotation));
};

/**
 * Similar to {@link Pattern#euclid}, but each pulse is held until the next pulse, so there will be no gaps.
 */
Pattern.prototype.euclidLegato = function (pulses, steps, rotation = 0) {
  const bin_pat = euclid(pulses, steps, rotation);
  const firstOne = bin_pat.indexOf(1);
  const gapless = rotate(bin_pat, firstOne)
    .join('')
    .split('1')
    .slice(1)
    .map((s) => [s.length + 1, true]);
  return this.struct(timeCat(...gapless)).late(Fraction(firstOne).div(steps));
};

export default euclid;
