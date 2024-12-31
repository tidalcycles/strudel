/*
pianoroll.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/canvas/pianoroll.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, noteToMidi, freqToMidi, isPattern } from '@strudel/core';
import { getTheme, getDrawContext } from './draw.mjs';

const scale = (normalized, min, max) => normalized * (max - min) + min;
const getValue = (e) => {
  let { value } = e;
  if (typeof e.value !== 'object') {
    value = { value };
  }
  let { note, n, freq, s } = value;
  if (freq) {
    return freqToMidi(freq);
  }
  note = note ?? n;
  if (typeof note === 'string') {
    try {
      // TODO: n(run(32)).scale("D:minor") fails when trying to query negative time..
      return noteToMidi(note);
    } catch (err) {
      // console.warn(`error converting note to midi: ${err}`); // this spams to crazy
      return 0;
    }
  }
  if (typeof note === 'number') {
    return note;
  }
  if (s) {
    return '_' + s;
  }
  return value;
};

/**
 * Visualises a pattern as a scrolling 'pianoroll', displayed in the background of the editor. To show a pianoroll for all running patterns, use `all(pianoroll)`. To have a pianoroll appear below
 * a pattern instead, prefix with `_`, e.g.: `sound("bd sd")._pianoroll()`.
 *
 * @name pianoroll
 * @synonyms punchcard
 * @param {Object} options Object containing all the optional following parameters as key value pairs:
 * @param {integer} cycles number of cycles to be displayed at the same time - defaults to 4
 * @param {number} playhead location of the active notes on the time axis - 0 to 1, defaults to 0.5
 * @param {boolean} vertical displays the roll vertically - 0 by default
 * @param {boolean} labels displays labels on individual notes (see the label function) - 0 by default
 * @param {boolean} flipTime reverse the direction of the roll - 0 by default
 * @param {boolean} flipValues reverse the relative location of notes on the value axis - 0 by default
 * @param {number} overscan lookup X cycles outside of the cycles window to display notes in advance - 1 by default
 * @param {boolean} hideNegative hide notes with negative time (before starting playing the pattern) - 0 by default
 * @param {boolean} smear notes leave a solid trace - 0 by default
 * @param {boolean} fold notes takes the full value axis width - 0 by default
 * @param {string} active hexadecimal or CSS color of the active notes - defaults to #FFCA28
 * @param {string} inactive hexadecimal or CSS color of the inactive notes - defaults to #7491D2
 * @param {string} background hexadecimal or CSS color of the background - defaults to transparent
 * @param {string} playheadColor hexadecimal or CSS color of the line representing the play head - defaults to white
 * @param {boolean} fill notes are filled with color (otherwise only the label is displayed) - 0 by default
 * @param {boolean} fillActive active notes are filled with color - 0 by default
 * @param {boolean} stroke notes are shown with colored borders - 0 by default
 * @param {boolean} strokeActive active notes are shown with colored borders - 0 by default
 * @param {boolean} hideInactive only active notes are shown - 0 by default
 * @param {boolean} colorizeInactive use note color for inactive notes - 1 by default
 * @param {string} fontFamily define the font used by notes labels - defaults to 'monospace'
 * @param {integer} minMidi minimum note value to display on the value axis - defaults to 10
 * @param {integer} maxMidi maximum note value to display on the value axis - defaults to 90
 * @param {boolean} autorange automatically calculate the minMidi and maxMidi parameters - 0 by default
 * @see _pianoroll
 * @example
 * note("c2 a2 eb2")
 * .euclid(5,8)
 * .s('sawtooth')
 * .lpenv(4).lpf(300)
 * .pianoroll({ labels: 1 })
 */

Pattern.prototype.pianoroll = function (options = {}) {
  let { cycles = 4, playhead = 0.5, overscan = 0, hideNegative = false, ctx = getDrawContext(), id = 1 } = options;

  let from = -cycles * playhead;
  let to = cycles * (1 - playhead);
  const inFrame = (hap, t) => (!hideNegative || hap.whole.begin >= 0) && hap.isWithinTime(t + from, t + to);
  this.draw(
    (haps, time) => {
      __pianoroll({
        ...options,
        time,
        ctx,
        haps: haps.filter((hap) => inFrame(hap, time)),
      });
    },
    {
      lookbehind: from - overscan,
      lookahead: to + overscan,
      id,
    },
  );
  return this;
};

export function pianoroll(arg) {
  if (isPattern(arg)) {
    // Single argument as a pattern
    // (to support `all(pianoroll)`)
    return arg.pianoroll();
  }
  // Single argument with option - return function to get the pattern
  // (to support `all(pianoroll(options))`)
  return (pat) => pat.pianoroll(arg);
}

export function __pianoroll({
  time,
  haps,
  cycles = 4,
  playhead = 0.5,
  flipTime = 0,
  flipValues = 0,
  hideNegative = false,
  inactive = getTheme().foreground,
  active = getTheme().foreground,
  background = 'transparent',
  smear = 0,
  playheadColor = getTheme().foreground,
  minMidi = 10,
  maxMidi = 90,
  autorange = 0,
  timeframe: timeframeProp,
  fold = 1,
  vertical = 0,
  labels = false,
  fill = 1,
  fillActive = false,
  strokeActive = true,
  stroke,
  hideInactive = 0,
  colorizeInactive = 1,
  fontFamily,
  ctx,
  id,
} = {}) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  let from = -cycles * playhead;
  let to = cycles * (1 - playhead);

  if (id) {
    haps = haps.filter((hap) => hap.hasTag(id));
  }

  if (timeframeProp) {
    console.warn('timeframe is deprecated! use from/to instead');
    from = 0;
    to = timeframeProp;
  }
  const timeAxis = vertical ? h : w;
  const valueAxis = vertical ? w : h;
  let timeRange = vertical ? [timeAxis, 0] : [0, timeAxis]; // pixel range for time
  const timeExtent = to - from; // number of seconds that fit inside the canvas frame
  const valueRange = vertical ? [0, valueAxis] : [valueAxis, 0]; // pixel range for values
  let valueExtent = maxMidi - minMidi + 1; // number of "slots" for values, overwritten if autorange true
  let barThickness = valueAxis / valueExtent; // pixels per value, overwritten if autorange true
  let foldValues = [];
  flipTime && timeRange.reverse();
  flipValues && valueRange.reverse();

  // onQuery
  const { min, max, values } = haps.reduce(
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
  foldValues = values.sort((a, b) =>
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : typeof a === 'number'
        ? 1
        : String(a).localeCompare(String(b)),
  );
  barThickness = fold ? valueAxis / foldValues.length : valueAxis / valueExtent;
  ctx.fillStyle = background;
  ctx.globalAlpha = 1; // reset!
  if (!smear) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillRect(0, 0, w, h);
  }
  haps.forEach((event) => {
    const isActive = event.whole.begin <= time && event.endClipped > time;
    let strokeCurrent = stroke ?? (strokeActive && isActive);
    let fillCurrent = (!isActive && fill) || (isActive && fillActive);
    if (hideInactive && !isActive) {
      return;
    }
    let color = event.value?.color;
    active = color || active;
    inactive = colorizeInactive ? color || inactive : inactive;
    color = isActive ? active : inactive;
    ctx.fillStyle = fillCurrent ? color : 'transparent';
    ctx.strokeStyle = color;
    const { velocity = 1, gain = 1 } = event.value || {};
    ctx.globalAlpha = velocity * gain;
    const timeProgress = (event.whole.begin - (flipTime ? to : from)) / timeExtent;
    const timePx = scale(timeProgress, ...timeRange);
    let durationPx = scale(event.duration / timeExtent, 0, timeAxis);
    const value = getValue(event);
    const valueProgress = fold
      ? foldValues.indexOf(value) / foldValues.length
      : (Number(value) - minMidi) / valueExtent;
    const valuePx = scale(valueProgress, ...valueRange);
    let margin = 0;
    const offset = scale(time / timeExtent, ...timeRange);
    let coords;
    if (vertical) {
      coords = [
        valuePx + 1 - (flipValues ? barThickness : 0), // x
        timeAxis - offset + timePx + margin + 1 - (flipTime ? 0 : durationPx), // y
        barThickness - 2, // width
        durationPx - 2, // height
      ];
    } else {
      coords = [
        timePx - offset + margin + 1 - (flipTime ? durationPx : 0), // x
        valuePx + 1 - (flipValues ? 0 : barThickness), // y
        durationPx - 2, // widith
        barThickness - 2, // height
      ];
    }
    /* const xFactor = Math.sin(performance.now() / 500) + 1;
      coords[0] *= xFactor; */

    if (strokeCurrent) {
      ctx.strokeRect(...coords);
    }
    if (fillCurrent) {
      ctx.fillRect(...coords);
    }
    //ctx.ellipse(...ellipseFromRect(...coords))
    if (labels) {
      const defaultLabel = event.value.note ?? event.value.s + (event.value.n ? `:${event.value.n}` : '');
      const { label: inactiveLabel, activeLabel } = event.value;
      const customLabel = isActive ? activeLabel || inactiveLabel : inactiveLabel;
      const label = customLabel ?? defaultLabel;
      let measure = vertical ? durationPx : barThickness * 0.75;
      ctx.font = `${measure}px ${fontFamily || 'monospace'}`;
      // font color
      ctx.fillStyle = /* isActive &&  */ !fillCurrent ? color : 'black';
      ctx.textBaseline = 'top';
      ctx.fillText(label, ...coords);
    }
  });
  ctx.globalAlpha = 1; // reset!
  const playheadPosition = scale(-from / timeExtent, ...timeRange);
  // draw playhead
  ctx.strokeStyle = playheadColor;
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(0, playheadPosition);
    ctx.lineTo(valueAxis, playheadPosition);
  } else {
    ctx.moveTo(playheadPosition, 0);
    ctx.lineTo(playheadPosition, valueAxis);
  }
  ctx.stroke();
  return this;
}

export function getDrawOptions(drawTime, options = {}) {
  let [lookbehind, lookahead] = drawTime;
  lookbehind = Math.abs(lookbehind);
  const cycles = lookahead + lookbehind;
  const playhead = cycles !== 0 ? lookbehind / cycles : 0;
  return { fold: 1, ...options, cycles, playhead };
}

export const getPunchcardPainter =
  (options = {}) =>
  (ctx, time, haps, drawTime) =>
    __pianoroll({ ctx, time, haps, ...getDrawOptions(drawTime, options) });

Pattern.prototype.punchcard = function (options) {
  return this.onPaint(getPunchcardPainter(options));
};

/**
 * Displays a vertical pianoroll with event labels.
 * Supports all the same options as pianoroll.
 *
 * @name wordfall
 */
Pattern.prototype.wordfall = function (options) {
  return this.punchcard({ vertical: 1, labels: 1, stroke: 0, fillActive: 1, active: 'white', ...options });
};

/* Pattern.prototype.pianoroll = function (options) {
  return this.onPaint((ctx, time, haps, drawTime) =>
    pianoroll({ ctx, time, haps, ...getDrawOptions(drawTime, { fold: 0, ...options }) }),
  );
}; */

export function drawPianoroll(options) {
  const { drawTime, ...rest } = options;
  __pianoroll({ ...getDrawOptions(drawTime), ...rest });
}
