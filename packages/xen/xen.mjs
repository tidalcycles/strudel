/*
xen.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/xen/xen.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { register, _mod, parseNumeral } from '@strudel/core';

export function edo(name) {
  if (!/^[1-9]+[0-9]*edo$/.test(name)) {
    throw new Error('not an edo scale: "' + name + '"');
  }
  const [_, divisions] = name.match(/^([1-9]+[0-9]*)edo$/);
  return Array.from({ length: divisions }, (_, i) => Math.pow(2, i / divisions));
}

const presets = {
  '12ji': [1 / 1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 16 / 9, 15 / 8],
};

function withBase(freq, scale) {
  return scale.map((r) => r * freq);
}

const defaultBase = 220;

function getXenScale(scale, indices) {
  if (typeof scale === 'string') {
    if (/^[1-9]+[0-9]*edo$/.test(scale)) {
      scale = edo(scale);
    } else if (presets[scale]) {
      scale = presets[scale];
    } else {
      throw new Error('unknown scale name: "' + scale + '"');
    }
  }
  scale = withBase(defaultBase, scale);
  if (!indices) {
    return scale;
  }
  return scale.filter((_, i) => indices.includes(i));
}

function xenOffset(xenScale, offset, index = 0) {
  const i = _mod(index + offset, xenScale.length);
  const oct = Math.floor(offset / xenScale.length);
  return xenScale[i] * Math.pow(2, oct);
}

// scaleNameOrRatios: string || number[], steps?: number
export const xen = register('xen', function (scaleNameOrRatios, pat) {
  return pat.withHap((hap) => {
    const scale = getXenScale(scaleNameOrRatios);
    const frequency = xenOffset(scale, parseNumeral(hap.value));
    return hap.withValue(() => frequency);
  });
});

export const tuning = register('tuning', function (ratios, pat) {
  return pat.withHap((hap) => {
    const frequency = xenOffset(ratios, parseNumeral(hap.value));
    return hap.withValue(() => frequency);
  });
});
