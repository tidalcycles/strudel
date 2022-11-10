/*
shapeshifter.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/eval/test/shapeshifter.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, it, expect } from 'vitest';
import shapeshifter, { wrappedAsync } from '../shapeshifter.mjs';

describe('shapeshifter', () => {
  it('Should shift simple double quote string', () => {
    if (wrappedAsync) {
      expect(shapeshifter('"c3"')).toEqual('(async()=>{return mini("c3")._withMiniLocation([1,0,15],[1,4,19])})()');
    } else {
      expect(shapeshifter('"c3"')).toEqual('return mini("c3")._withMiniLocation([1,0,0],[1,4,4])');
    }
  });
  if (wrappedAsync) {
    it('Should handle dynamic imports', () => {
      expect(shapeshifter('const { default: foo } = await import(\'https://bar.com/foo.js\');"c3"')).toEqual(
        'const{default:foo}=await import("https://bar.com/foo.js");return mini("c3").withMiniLocation([1,64,79],[1,68,83])',
      );
    });
  }
});
