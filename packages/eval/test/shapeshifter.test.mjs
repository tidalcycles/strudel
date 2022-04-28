/*
shapeshifter.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/eval/test/shapeshifter.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { strict as assert } from 'assert';
import shapeshifter from '../shapeshifter.mjs';

describe('shapeshifter', () => {
  it('Should shift simple double quote string', () => {
    assert.equal(shapeshifter('"c3"'), '(async()=>{return mini("c3").withMiniLocation([1,0,15],[1,4,19])})()');
  });
});
