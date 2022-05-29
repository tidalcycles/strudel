/*
voicings.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tonal/voicings.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern as _Pattern, stack, Hap, reify } from '@strudel.cycles/core';
import _voicings from 'chord-voicings';
const { dictionaryVoicing, minTopNoteDiff, lefthand } = _voicings.default || _voicings; // parcel module resolution fuckup

const getVoicing = (chord, lastVoicing, range = ['F3', 'A4']) =>
  dictionaryVoicing({
    chord,
    dictionary: lefthand,
    range,
    picker: minTopNoteDiff,
    lastVoicing,
  });

const Pattern = _Pattern;

Pattern.prototype.fmapNested = function (func) {
  return new Pattern((span) =>
    this.query(span)
      .map((event) =>
        reify(func(event))
          .query(span)
          .map((hap) => new Hap(event.whole, event.part, hap.value, hap.context)),
      )
      .flat(),
  );
};

/**
 * Turns chord symbols into voicings, using the smoothest voice leading possible.
 * Uses [chord-voicings package](https://github.com/felixroos/chord-voicings#chord-voicings).
 *
 * @name voicings
 * @memberof Pattern
 * @param {range} range note range for possible voicings (optional, defaults to `['F3', 'A4']`)
 * @returns Pattern
 * @example
 * stack("<C^7 A7 Dm7 G7>".voicings(), "<C3 A2 D3 G2>")
 */

Pattern.prototype.voicings = function (range) {
  let lastVoicing;
  if (!range?.length) {
    // allows to pass empty array, if too lazy to specify range
    range = ['F3', 'A4'];
  }
  return this.fmapNested((event) => {
    lastVoicing = getVoicing(event.value, lastVoicing, range);
    return stack(...lastVoicing)._withContext(() => ({
      locations: event.context.locations || [],
    }));
  });
};

Pattern.prototype._rootNotes = function (octave = 2) {
  return this.fmap((value) => {
    const [_, root] = value.match(/^([a-gA-G][b#]?).*$/);
    return root + octave;
  });
};

Pattern.prototype.define('voicings', (range, pat) => pat.voicings(range), { composable: true });
Pattern.prototype.define('rootNotes', (oct, pat) => pat.rootNotes(oct), { composable: true, patternified: true });
