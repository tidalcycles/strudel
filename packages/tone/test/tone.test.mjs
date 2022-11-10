/*
tone.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tone/test/tone.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import '../tone.mjs';
import { pure } from '@strudel.cycles/core';
import { describe, it, expect } from 'vitest';

describe('tone', () => {
  it('Should have working tone function', () => {
    // const s = synth().chain(out()); // TODO: mock audio context?
    // assert.deepStrictEqual(s, new Tone.Synth().chain(out()));
    const s = {};
    expect(pure('c3').tone(s).firstCycleValues).toEqual(['c3']);
  });
});
