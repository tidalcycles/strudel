/*
voicings.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tonal/voicings.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { stack, register, silence, logger } from '@strudel/core';
import { renderVoicing } from './tonleiter.mjs';
import _voicings from 'chord-voicings';
import { complex, simple } from './ireal.mjs';
const { dictionaryVoicing, minTopNoteDiff } = _voicings.default || _voicings; // parcel module resolution fuckup

const lefthand = {
  m7: ['3m 5P 7m 9M', '7m 9M 10m 12P'],
  7: ['3M 6M 7m 9M', '7m 9M 10M 13M'],
  '^7': ['3M 5P 7M 9M', '7M 9M 10M 12P'],
  69: ['3M 5P 6A 9M'],
  m7b5: ['3m 5d 7m 8P', '7m 8P 10m 12d'],
  '7b9': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
  '7b13': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
  o7: ['1P 3m 5d 6M', '5d 6M 8P 10m'],
  '7#11': ['7m 9M 11A 13A'],
  '7#9': ['3M 7m 9A'],
  mM7: ['3m 5P 7M 9M', '7M 9M 10m 12P'],
  m6: ['3m 5P 6M 9M', '6M 9M 10m 12P'],
};

const guidetones = {
  m7: ['3m 7m', '7m 10m'],
  m9: ['3m 7m', '7m 10m'],
  7: ['3M 7m', '7m 10M'],
  '^7': ['3M 7M', '7M 10M'],
  '^9': ['3M 7M', '7M 10M'],
  69: ['3M 6M'],
  6: ['3M 6M', '6M 10M'],
  m7b5: ['3m 7m', '7m 10m'],
  '7b9': ['3M 7m', '7m 10M'],
  '7b13': ['3M 7m', '7m 10M'],
  o7: ['3m 6M', '6M 10m'],
  '7#11': ['3M 7m', '7m 10M'],
  '7#9': ['3M 7m', '7m 10M'],
  mM7: ['3m 7M', '7M 10m'],
  m6: ['3m 6M', '6M 10m'],
};

const triads = {
  '': ['1P 3M 5P', '3M 5P 8P', '5P 8P 10M'],
  M: ['1P 3M 5P', '3M 5P 8P', '5P 8P 10M'],
  m: ['1P 3m 5P', '3m 5P 8P', '5P 8P 10m'],
  o: ['1P 3m 5d', '3m 5d 8P', '5d 8P 10m'],
  aug: ['1P 3m 5A', '3m 5A 8P', '5A 8P 10m'],
};

const defaultDictionary = {
  // triads
  '': ['1P 3M 5P', '3M 5P 8P', '5P 8P 10M'],
  M: ['1P 3M 5P', '3M 5P 8P', '5P 8P 10M'],
  m: ['1P 3m 5P', '3m 5P 8P', '5P 8P 10m'],
  o: ['1P 3m 5d', '3m 5d 8P', '5d 8P 10m'],
  aug: ['1P 3m 5A', '3m 5A 8P', '5A 8P 10m'],
  // sevenths chords
  m7: ['3m 5P 7m 9M', '7m 9M 10m 12P'],
  7: ['3M 6M 7m 9M', '7m 9M 10M 13M'],
  '^7': ['3M 5P 7M 9M', '7M 9M 10M 12P'],
  69: ['3M 5P 6A 9M'],
  m7b5: ['3m 5d 7m 8P', '7m 8P 10m 12d'],
  '7b9': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
  '7b13': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
  o7: ['1P 3m 5d 6M', '5d 6M 8P 10m'],
  '7#11': ['7m 9M 11A 13A'],
  '7#9': ['3M 7m 9A'],
  mM7: ['3m 5P 7M 9M', '7M 9M 10m 12P'],
  m6: ['3m 5P 6M 9M', '6M 9M 10m 12P'],
};

export const voicingRegistry = {
  lefthand: { dictionary: lefthand, range: ['F3', 'A4'], mode: 'below', anchor: 'a4' },
  triads: { dictionary: triads, mode: 'below', anchor: 'a4' },
  guidetones: { dictionary: guidetones, mode: 'above', anchor: 'a4' },
  legacy: { dictionary: defaultDictionary, mode: 'below', anchor: 'a4' },
};

let defaultDict = 'ireal';
export const setDefaultVoicings = (dict) => (defaultDict = dict);
// e.g. typeof setDefaultVoicings !== 'undefined' && setDefaultVoicings('legacy');

export const setVoicingRange = (name, range) => addVoicings(name, voicingRegistry[name].dictionary, range);

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
  Object.assign(voicingRegistry, { [name]: { dictionary, range } });
};

// new call signature
export const registerVoicings = (name, dictionary, options = {}) => {
  Object.assign(voicingRegistry, { [name]: { dictionary, ...options } });
};

const getVoicing = (chord, dictionaryName, lastVoicing) => {
  const { dictionary, range } = voicingRegistry[dictionaryName];
  return dictionaryVoicing({
    chord,
    dictionary,
    range,
    picker: minTopNoteDiff,
    lastVoicing,
  });
};

/**
 * DEPRECATED: still works, but it is recommended you use .voicing instead (without s).
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

let lastVoicing; // this now has to be global until another solution is found :-/
// it used to be local to the voicings function at evaluation time
// but since register will patternify by default, means that
// the function is called over and over again, resetting the lastVoicing variables
export const voicings = register('voicings', function (dictionary, pat) {
  return pat
    .fmap((value) => {
      lastVoicing = getVoicing(value, dictionary, lastVoicing);
      return stack(...lastVoicing);
    })
    .outerJoin();
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
    const chord = value.chord || value;
    const root = chord.match(/^([a-gA-G][b#]?).*$/)[1];
    const note = root + octave;
    return value.chord ? { note } : note;
  });
});

/**
 * Turns chord symbols into voicings. You can use the following control params:
 *
 * - `chord`: Note, followed by chord symbol, e.g. C Am G7 Bb^7
 * - `dict`: voicing dictionary to use, falls back to default dictionary
 * - `anchor`: the note that is used to align the chord
 * - `mode`: how the voicing is aligned to the anchor
 *   - `below`: top note <= anchor
 *   - `duck`: top note <= anchor, anchor excluded
 *   - `above`: bottom note >= anchor
 * - `offset`: whole number that shifts the voicing up or down to the next voicing
 * - `n`: if set, the voicing is played like a scale. Overshooting numbers will be octaved
 *
 * All of the above controls are optional, except `chord`.
 * If you pass a pattern of strings to voicing, they will be interpreted as chords.
 *
 * @name voicing
 * @returns Pattern
 * @example
 * n("0 1 2 3").chord("<C Am F G>").voicing()
 */
export const voicing = register('voicing', function (pat) {
  return pat
    .fmap((value) => {
      // destructure voicing controls out
      value = typeof value === 'string' ? { chord: value } : value;
      let { dictionary = defaultDict, chord, anchor, offset, mode, n, octaves, ...rest } = value;
      dictionary =
        typeof dictionary === 'string' ? voicingRegistry[dictionary] : { dictionary, mode: 'below', anchor: 'c5' };
      try {
        let notes = renderVoicing({ ...dictionary, chord, anchor, offset, mode, n, octaves });
        return stack(...notes)
          .note()
          .set(rest); // rest does not include voicing controls anymore!
      } catch (err) {
        logger(`[voicing]: unknown chord "${chord}"`);
        return silence;
      }
    })
    .outerJoin();
});

export function voicingAlias(symbol, alias, setOrSets) {
  setOrSets = !Array.isArray(setOrSets) ? [setOrSets] : setOrSets;
  setOrSets.forEach((set) => {
    set[alias] = set[symbol];
  });
}

// no symbol = major chord
voicingAlias('^', '', [simple, complex]);

Object.keys(simple).forEach((symbol) => {
  // add aliases for "-" === "m"
  if (symbol.includes('-')) {
    let alias = symbol.replace('-', 'm');
    voicingAlias(symbol, alias, [complex, simple]);
  }
  // add aliases for "^" === "M"
  if (symbol.includes('^')) {
    let alias = symbol.replace('^', 'M');
    voicingAlias(symbol, alias, [complex, simple]);
  }
  // add aliases for "+" === "aug"
  if (symbol.includes('+')) {
    let alias = symbol.replace('+', 'aug');
    voicingAlias(symbol, alias, [complex, simple]);
  }
});

registerVoicings('ireal', simple);
registerVoicings('ireal-ext', complex);

export function resetVoicings() {
  lastVoicing = undefined;
  setDefaultVoicings('ireal');
}
