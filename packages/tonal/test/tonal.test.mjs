/*
tonal.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tonal/test/tonal.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// import { strict as assert } from 'assert';

import '../tonal.mjs'; // need to import this to add prototypes
import { pure, controls, seq } from '@strudel.cycles/core';
import { describe, it, expect } from 'vitest';
import { mini } from '../../mini/mini.mjs';
const { n } = controls;

describe('tonal', () => {
  it('Should run tonal functions ', () => {
    expect(pure('c3').scale('C major').scaleTranspose(1).firstCycleValues).toEqual(['D3']);
  });
  it('scale with plain values', () => {
    expect(
      seq(0, 1, 2)
        .scale('C major')
        .note()
        .firstCycleValues.map((h) => h.note),
    ).toEqual(['C3', 'D3', 'E3']);
  });
  it('scale with n values', () => {
    expect(
      n(0, 1, 2)
        .scale('C major')
        .firstCycleValues.map((h) => h.note),
    ).toEqual(['C3', 'D3', 'E3']);
  });
  it('scale with colon', () => {
    expect(
      n(0, 1, 2)
        .scale('C:major')
        .firstCycleValues.map((h) => h.note),
    ).toEqual(['C3', 'D3', 'E3']);
  });
  it('scale with mininotation colon', () => {
    expect(
      n(0, 1, 2)
        .scale(mini('C:major'))
        .firstCycleValues.map((h) => h.note),
    ).toEqual(['C3', 'D3', 'E3']);
  });
});
