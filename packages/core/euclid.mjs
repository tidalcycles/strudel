/*
euclid.mjs - Bjorklund/Euclidean/Diaspora rhythms
Copyright (C) 2023 Rohan Drape and strudel contributors

See <https://github.com/tidalcycles/strudel/blob/main/packages/core/euclid.mjs> for authors of this file.

The Bjorklund algorithm implementation is ported from the Haskell Music Theory Haskell module by Rohan Drape -
https://rohandrape.net/?t=hmt

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, timeCat, register, silence } from './pattern.mjs';
import { rotate, flatten, splitAt, zipWith } from './util.mjs';
import Fraction from './fraction.mjs';

const left = function (n, x) {
  const [ons, offs] = n;
  const [xs, ys] = x;
  const [_xs, __xs] = splitAt(offs, xs);
  return [
    [offs, ons - offs],
    [zipWith((a, b) => a.concat(b), _xs, ys), __xs],
  ];
};

const right = function (n, x) {
  const [ons, offs] = n;
  const [xs, ys] = x;
  const [_ys, __ys] = splitAt(ons, ys);
  const result = [
    [ons, offs - ons],
    [zipWith((a, b) => a.concat(b), xs, _ys), __ys],
  ];
  return result;
};

const _bjork = function (n, x) {
  const [ons, offs] = n;
  return Math.min(ons, offs) <= 1 ? [n, x] : _bjork(...(ons > offs ? left(n, x) : right(n, x)));
};

export const bjork = function (ons, steps) {
  const inverted = ons < 0;
  ons = Math.abs(ons);
  const offs = steps - ons;
  const x = Array(ons).fill([1]);
  const y = Array(offs).fill([0]);
  const result = _bjork([ons, offs], [x, y]);
  const p = flatten(result[1][0]).concat(flatten(result[1][1]));
  if (inverted) {
    return p.map((x) => (x === 0 ? 1 : 0));
  }
  return p;
};

/**
 * Changes the structure of the pattern to form an euclidean rhythm.
 * Euclidian rhythms are rhythms obtained using the greatest common
 * divisor of two numbers.  They were described in 2004 by Godfried
 * Toussaint, a canadian computer scientist.  Euclidian rhythms are
 * really useful for computer/algorithmic music because they can
 * describe a large number of rhythms with a couple of numbers.
 *
 * @memberof Pattern
 * @name euclid
 * @param {number} pulses the number of onsets / beats
 * @param {number} steps the number of steps to fill
 * @returns Pattern
 * @example
 * // The Cuban tresillo pattern.
 * note("c3").euclid(3,8)
 */

/**
 * Like `euclid`, but has an additional parameter for 'rotating' the resulting sequence.
 * @memberof Pattern
 * @name euclidRot
 * @param {number} pulses the number of onsets / beats
 * @param {number} steps the number of steps to fill
 * @param {number} rotation offset in steps
 * @returns Pattern
 * @example
 * // A Samba rhythm necklace from Brazil
 * note("c3").euclidRot(3,16,14)
 */

/**
 * @example // A thirteenth century Persian rhythm called Khafif-e-ramal.
 * note("c3").euclid(2,5)
 * @example // The archetypal pattern of the Cumbia from Colombia, as well as a Calypso rhythm from Trinidad.
 * note("c3").euclid(3,4)
 * @example // Another thirteenth century Persian rhythm by the name of Khafif-e-ramal, as well as a Rumanian folk-dance rhythm.
 * note("c3").euclidRot(3,5,2)
 * @example // A Ruchenitza rhythm used in a Bulgarian folk-dance.
 * note("c3").euclid(3,7)
 * @example // The Cuban tresillo pattern.
 * note("c3").euclid(3,8)
 * @example // Another Ruchenitza Bulgarian folk-dance rhythm.
 * note("c3").euclid(4,7)
 * @example // The Aksak rhythm of Turkey.
 * note("c3").euclid(4,9)
 * @example // The metric pattern used by Frank Zappa in his piece titled Outside Now.
 * note("c3").euclid(4,11)
 * @example // Yields the York-Samai pattern, a popular Arab rhythm.
 * note("c3").euclid(5,6)
 * @example // The Nawakhat pattern, another popular Arab rhythm.
 * note("c3").euclid(5,7)
 * @example // The Cuban cinquillo pattern.
 * note("c3").euclid(5,8)
 * @example // A popular Arab rhythm called Agsag-Samai.
 * note("c3").euclid(5,9)
 * @example // The metric pattern used by Moussorgsky in Pictures at an Exhibition.
 * note("c3").euclid(5,11)
 * @example // The Venda clapping pattern of a South African children’s song.
 * note("c3").euclid(5,12)
 * @example // The Bossa-Nova rhythm necklace of Brazil.
 * note("c3").euclid(5,16)
 * @example // A typical rhythm played on the Bendir (frame drum).
 * note("c3").euclid(7,8)
 * @example // A common West African bell pattern.
 * note("c3").euclid(7,12)
 * @example // A Samba rhythm necklace from Brazil.
 * note("c3").euclidRot(7,16,14)
 * @example // A rhythm necklace used in the Central African Republic.
 * note("c3").euclid(9,16)
 * @example // A rhythm necklace of the Aka Pygmies of Central Africa.
 * note("c3").euclidRot(11,24,14)
 * @example // Another rhythm necklace of the Aka Pygmies of the upper Sangha.
 * note("c3").euclidRot(13,24,5)
 */

const _euclidRot = function (pulses, steps, rotation) {
  const b = bjork(pulses, steps);
  if (rotation) {
    return rotate(b, -rotation);
  }
  return b;
};

export const euclid = register('euclid', function (pulses, steps, pat) {
  return pat.struct(_euclidRot(pulses, steps, 0));
});

export const { euclidrot, euclidRot } = register(['euclidrot', 'euclidRot'], function (pulses, steps, rotation, pat) {
  return pat.struct(_euclidRot(pulses, steps, rotation));
});

/**
 * Similar to `euclid`, but each pulse is held until the next pulse,
 * so there will be no gaps.
 * @name euclidLegato
 * @memberof Pattern
 * @param {number} pulses the number of onsets / beats
 * @param {number} steps the number of steps to fill
 * @example
 * note("c3").euclidLegato(3,8)
 */

const _euclidLegato = function (pulses, steps, rotation, pat) {
  if (pulses < 1) {
    return silence;
  }
  const bin_pat = _euclidRot(pulses, steps, rotation);
  const gapless = bin_pat
    .join('')
    .split('1')
    .slice(1)
    .map((s) => [s.length + 1, true]);
  return pat.struct(timeCat(...gapless));
};

export const euclidLegato = register(['euclidLegato'], function (pulses, steps, pat) {
  return _euclidLegato(pulses, steps, 0, pat);
});

/**
 * Similar to `euclid`, but each pulse is held until the next pulse,
 * so there will be no gaps, and has an additional parameter for 'rotating'
 * the resulting sequence
 * @name euclidLegatoRot
 * @memberof Pattern
 * @param {number} pulses the number of onsets / beats
 * @param {number} steps the number of steps to fill
 * @param {number} rotation offset in steps
 * @example
 * note("c3").euclidLegatoRot(3,5,2)
 */
export const euclidLegatoRot = register(['euclidLegatoRot'], function (pulses, steps, rotation, pat) {
  return _euclidLegato(pulses, steps, rotation, pat);
});
