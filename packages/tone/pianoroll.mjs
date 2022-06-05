/*
pianoroll.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tone/pianoroll.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern } from '@strudel.cycles/core';

Pattern.prototype.pianoroll = function ({
  from = -2,
  to = 2,
  overscan = 1,
  inactive = '#C9E597',
  active = '#FFCA28',
  // background = '#2A3236',
  background = 'transparent',
  maxMidi,
  minMidi,
  timeframe: timeFrameProp,
} = {}) {
  if (timeFrameProp) {
    console.warn('timeframe is deprecated! use from/to instead');
    from = 0;
    to = timeFrameProp;
  }
  const ctx = getDrawContext();
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  let midiRange, height;
  const autorange = minMidi === undefined || maxMidi === undefined;
  if (autorange && (minMidi !== undefined || maxMidi !== undefined)) {
    console.warn('pianoroll: minMidi and maxMidi must both be set to have an effect!');
  }
  if (!autorange) {
    midiRange = maxMidi - minMidi + 1;
    height = h / midiRange;
  }
  const timeframe = to - from;
  const t2x = (t) => Math.round(((t - from) / timeframe) * w);
  const playheadX = t2x(0);
  this.draw(
    (ctx, events, t) => {
      ctx.fillStyle = background;
      ctx.clearRect(0, 0, w, h);
      ctx.fillRect(0, 0, w, h);
      const inFrame = (event) => event.whole.begin >= 0 && event.whole.begin <= t + to && event.whole.end >= t + from;
      events.filter(inFrame).forEach((event) => {
        const isActive = event.whole.begin <= t && event.whole.end >= t;
        ctx.fillStyle = event.context?.color || inactive;
        ctx.strokeStyle = event.context?.color || active;
        ctx.globalAlpha = event.context.velocity ?? 1;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, h);
        ctx.stroke();
        const x = t2x(event.whole.begin);
        const width = Math.round(((event.whole.end - event.whole.begin) / timeframe) * w);
        const y = Math.round(h - ((Number(event.value) - minMidi + 1) / midiRange) * h);
        const offset = (t / timeframe) * w;
        const margin = 0;
        const coords = [x - offset + margin + 1, y + 1, width - 2, height - 2];
        isActive ? ctx.strokeRect(...coords) : ctx.fillRect(...coords);
      });
    },
    {
      from: from - overscan,
      to: to + overscan,
      onQuery: (events) => {
        if (autorange) {
          const getValue = (e) => Number(e.value);
          const { min, max } = events.reduce(
            ({ min, max }, e) => {
              const v = getValue(e);
              return {
                min: v < min ? v : min,
                max: v > max ? v : max,
              };
            },
            { min: Infinity, max: -Infinity },
          );
          minMidi = min;
          maxMidi = max;
          midiRange = maxMidi - minMidi + 1;
          height = h / midiRange;
        }
      },
    },
  );
  return this;
};
