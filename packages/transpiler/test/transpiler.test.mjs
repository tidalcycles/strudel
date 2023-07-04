/*
transpiler.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/transpiler/test/transpiler.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, it, expect } from 'vitest';
import { transpiler } from '../transpiler.mjs';

const simple = { wrapAsync: false, addReturn: false, simpleLocs: true };

describe('transpiler', () => {
  it('wraps double quote string with mini and adds location', () => {
    expect(transpiler('"c3"', simple).output).toEqual("m('c3', 0);");
    expect(transpiler('stack("c3","bd sd")', simple).output).toEqual("stack(m('c3', 6), m('bd sd', 11));");
  });
  it('wraps backtick string with mini and adds location', () => {
    expect(transpiler('`c3`', simple).output).toEqual("m('c3', 0);");
  });
  it('replaces note variables with note strings', () => {
    expect(transpiler('seq(c3, d3)', simple).output).toEqual("seq('c3', 'd3');");
  });
  it('keeps tagged template literal as is', () => {
    expect(transpiler('xxx`c3`', simple).output).toEqual('xxx`c3`;');
  });
  it('supports top level await', () => {
    expect(transpiler("await samples('xxx');", simple).output).toEqual("await samples('xxx');");
  });
  /*   it('parses dynamic imports', () => {
    expect(
      transpiler("const { default: foo } = await import('https://bar.com/foo.js');", {
        wrapAsync: false,
        addReturn: false,
      }),
    ).toEqual("const {default: foo} = await import('https://bar.com/foo.js');");
  }); */
  it('collections locations', () => {
    const { miniLocations } = transpiler(`s("bd", "hh oh")`, { ...simple, emitMiniLocations: true });
    expect(miniLocations).toEqual([
      [3, 5],
      [9, 11],
      [12, 14],
    ]);
  });
});
