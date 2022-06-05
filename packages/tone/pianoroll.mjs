/*
pianoroll.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tone/pianoroll.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern } from '@strudel.cycles/core';

const scale = (normalized, min, max) => normalized * (max - min) + min;

Pattern.prototype.pianoroll = function ({
  cycles = 4,
  playhead = 0.5,
  overscan = 1,
  flipTime = 0,
  flipValues = 0,
  hideNegative = false,
  inactive = '#C9E597',
  active = '#FFCA28',
  // background = '#2A3236',
  background = 'transparent',
  minMidi = 10,
  maxMidi = 90,
  autorange = 0,
  timeframe: timeframeProp,
  fold = 0,
  vertical = 0,
} = {}) {
  const ctx = getDrawContext();
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const from = -cycles * playhead;
  const to = cycles * (1 - playhead);

  if (timeframeProp) {
    console.warn('timeframe is deprecated! use from/to instead');
    from = 0;
    to = timeframeProp;
  }
  if (!autorange && fold) {
    console.warn('disabling autorange has no effect when fold is enabled');
  }
  const timeAxis = vertical ? h : w;
  const valueAxis = vertical ? w : h;
  // scale normalized value n to max pixels, flippable
  let timeRange = vertical ? [timeAxis, 0] : [0, timeAxis]; // pixel range for time
  const timeExtent = to - from; // number of seconds that fit inside the canvas frame
  const valueRange = vertical ? [0, valueAxis] : [valueAxis, 0]; // pixel range for values
  let valueExtent = maxMidi - minMidi + 1; // number of "slots" for values, overwritten if autorange true
  let barThickness = valueAxis / valueExtent; // pixels per value, overwritten if autorange true
  let foldValues = [];
  flipTime && timeRange.reverse();
  flipValues && valueRange.reverse();

  // duration to px (on timeAxis)
  const playheadPosition = scale(-from / timeExtent, ...timeRange);
  this.draw(
    (ctx, events, t) => {
      ctx.fillStyle = background;
      ctx.clearRect(0, 0, w, h);
      ctx.fillRect(0, 0, w, h);
      const inFrame = (event) =>
        (!hideNegative || event.whole.begin >= 0) && event.whole.begin <= t + to && event.whole.end >= t + from;
      events.filter(inFrame).forEach((event) => {
        const isActive = event.whole.begin <= t && event.whole.end > t;
        ctx.fillStyle = event.context?.color || inactive;
        ctx.strokeStyle = event.context?.color || active;
        ctx.globalAlpha = event.context.velocity ?? 1;
        ctx.beginPath();
        if (vertical) {
          ctx.moveTo(0, playheadPosition);
          ctx.lineTo(valueAxis, playheadPosition);
        } else {
          ctx.moveTo(playheadPosition, 0);
          ctx.lineTo(playheadPosition, valueAxis);
        }
        ctx.stroke();
        const timePx = scale((event.whole.begin - (flipTime ? to : from)) / timeExtent, ...timeRange);
        let durationPx = scale(event.duration / timeExtent, 0, timeAxis);

        const valuePx = scale(
          fold ? foldValues.indexOf(event.value) / foldValues.length : (Number(event.value) - minMidi) / valueExtent,
          ...valueRange,
        );
        let margin = 0;
        // apply some pixel adjustments
        const offset = scale(t / timeExtent, ...timeRange);
        let coords;
        if (vertical) {
          coords = [
            valuePx + 1 - (flipValues ? barThickness : 0), // x
            timeAxis - offset + timePx + margin + 1 - (flipTime ? 0 : durationPx), // y
            barThickness - 2, // width
            durationPx - 2, // height
          ];
          // console.log(event.value, 'coords', coords);
        } else {
          coords = [
            timePx - offset + margin + 1 - (flipTime ? durationPx : 0), // x
            valuePx + 1 - (flipValues ? 0 : barThickness), // y
            durationPx - 2, // widith
            barThickness - 2, // height
          ];
        }
        isActive ? ctx.strokeRect(...coords) : ctx.fillRect(...coords);
      });
    },
    {
      from: from - overscan,
      to: to + overscan,
      onQuery: (events) => {
        const getValue = (e) => Number(e.value);
        const { min, max, values } = events.reduce(
          ({ min, max, values }, e) => {
            const v = getValue(e);
            return {
              min: v < min ? v : min,
              max: v > max ? v : max,
              values: values.includes(v) ? values : [...values, v],
            };
          },
          { min: Infinity, max: -Infinity, values: [] },
        );
        if (autorange) {
          minMidi = min;
          maxMidi = max;
          valueExtent = maxMidi - minMidi + 1;
        }
        foldValues = values.sort((a, b) => a - b);
        barThickness = fold ? valueAxis / foldValues.length : valueAxis / valueExtent;
      },
    },
  );
  return this;
};
