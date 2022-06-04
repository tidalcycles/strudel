/*
draw.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tone/draw.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Tone } from './tone.mjs';
import { Pattern } from '@strudel.cycles/core';

export const getDrawContext = (id = 'test-canvas') => {
  let canvas = document.querySelector('#' + id);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style = 'pointer-events:none;width:100%;height:100%;position:fixed;top:0;left:0;z-index:5';
    document.body.prepend(canvas);
  }
  return canvas.getContext('2d');
};

Pattern.prototype.draw = function (callback, { from, to, onQuery }) {
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const ctx = getDrawContext();
  let cycle,
    events = [];
  const animate = (time) => {
    const t = Tone.getTransport().seconds;
    if (from !== undefined && to !== undefined) {
      const currentCycle = Math.floor(t);
      if (cycle !== currentCycle) {
        cycle = currentCycle;
        const begin = currentCycle + from;
        const end = currentCycle + to;
        setTimeout(() => {
          events = this._asNumber(true) // true = silent error
            .query(new State(new TimeSpan(begin, end)))
            .filter(Boolean)
            .filter((event) => event.part.begin.equals(event.whole.begin));
          onQuery?.(events);
        }, 0);
      }
    }
    callback(ctx, events, t, time);
    window.strudelAnimation = requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  return this;
};

export const cleanupDraw = () => {
  const ctx = getDrawContext();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  if (window.strudelScheduler) {
    clearInterval(window.strudelScheduler);
  }
};
