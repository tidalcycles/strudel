/*
voicings.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tonal/voicings.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { stack, register } from '@strudel.cycles/core';
import _voicings from 'chord-voicings';
const { dictionaryVoicing, minTopNoteDiff, lefthand } = _voicings.default || _voicings; // parcel module resolution fuckup

export const voicingDictionaries = {
  lefthand: { dictionary: lefthand, range: ['F3', 'A4'] },
};

/**
 * Adds a new custom voicing dictionary.
 *
 * @name addVoicings
 * @memberof Pattern
 * @param {string} name identifier for the voicing dictionary
 * @param {Object} dictionary maps chord symbol to possible voicings
 * @param {Array} range min, max note
 * @returns Pattern
 * @example
 * addVoicings('cookie', {
 *   7: ['3M 7m 9M 12P 15P', '7m 10M 13M 16M 19P'],
 *   '^7': ['3M 6M 9M 12P 14M', '7M 10M 13M 16M 19P'],
 *   m7: ['8P 11P 14m 17m 19P', '5P 8P 11P 14m 17m'],
 *   m7b5: ['3m 5d 8P 11P 14m', '5d 8P 11P 14m 17m'],
 *   o7: ['3m 6M 9M 11A 15P'],
 *   '7alt': ['3M 7m 10m 13m 15P'],
 *   '7#11': ['7m 10m 13m 15P 17m'],
 * }, ['C3', 'C6'])
 * "<C^7 A7 Dm7 G7>".voicings('cookie').note()
 */
export const addVoicings = (name, dictionary, range = ['F3', 'A4']) => {
  Object.assign(voicingDictionaries, { [name]: { dictionary, range } });
};

const getVoicing = (chord, dictionaryName, lastVoicing) => {
  const { dictionary, range } = voicingDictionaries[dictionaryName];
  return dictionaryVoicing({
    chord,
    dictionary,
    range,
    picker: minTopNoteDiff,
    lastVoicing,
  });
};

/**
 * Turns chord symbols into voicings, using the smoothest voice leading possible.
 * Uses [chord-voicings package](https://github.com/felixroos/chord-voicings#chord-voicings).
 *
 * @name voicings
 * @memberof Pattern
 * @param {string} dictionary which voicing dictionary to use.
 * @returns Pattern
 * @example
 * stack("<C^7 A7 Dm7 G7>".voicings('lefthand'), "<C3 A2 D3 G2>").note()
 */

export const voicings = register('voicings', function (dictionary, pat) {
  let lastVoicing;
  return pat
    .fmap((value) => {
      lastVoicing = getVoicing(value, dictionary, lastVoicing);
      return stack(...lastVoicing);
    })
    .outerJoin();
  /* .withContext(() => ({
      locations: event.context.locations || [],
    })); */
});

/**
 * Maps the chords of the incoming pattern to root notes in the given octave.
 *
 * @name rootNotes
 * @memberof Pattern
 * @param {octave} octave octave to use
 * @returns Pattern
 * @example
 * "<C^7 A7 Dm7 G7>".rootNotes(2).note()
 */
export const rootNotes = register('rootNotes', function (octave, pat) {
  return pat.fmap((value) => {
    const root = value.match(/^([a-gA-G][b#]?).*$/)[1];
    return root + octave;
  });
});
