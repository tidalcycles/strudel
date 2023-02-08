/*
link-server.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/osc/osc.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { connectOSC } from '@strudel.cycles/osc';
import { Pattern, silence } from '@strudel.cycles/core';

/**
 *
 * Connects to Ableton Link
 *
 * @name link
 * @memberof Pattern
 * @returns Pattern
 */
console.log('link-client');
Pattern.prototype.link = async function () {
  const osc = await connectOSC();
  osc.on('*', (msg) => {
    const [begin, end, cps] = msg.address.split('/');
    console.log(begin, end, cps);
  });
  return silence;
};
