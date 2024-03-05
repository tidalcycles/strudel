/*
draw.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/draw.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, getTime, State, TimeSpan } from './index.mjs';

export const getDrawContext = (id = 'test-canvas') => {
  let canvas = document.querySelector('#' + id);
  if (!canvas) {
    const scale = 2; // 2 = crisp on retina screens
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style = 'pointer-events:none;width:100%;height:100%;position:fixed;top:0;left:0';
    document.body.prepend(canvas);
    let timeout;
    window.addEventListener('resize', () => {
      timeout && clearTimeout(timeout);
      timeout = setTimeout(() => {
        canvas.width = window.innerWidth * scale;
        canvas.height = window.innerHeight * scale;
      }, 200);
    });
  }
  return canvas.getContext('2d');
};

Pattern.prototype.draw = function (callback, { from, to, onQuery } = {}) {
  if (typeof window === 'undefined') {
    return this;
  }
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const ctx = getDrawContext();
  let cycle,
    events = [];
  const animate = (time) => {
    const t = getTime();
    if (from !== undefined && to !== undefined) {
      const currentCycle = Math.floor(t);
      if (cycle !== currentCycle) {
        cycle = currentCycle;
        const begin = currentCycle + from;
        const end = currentCycle + to;
        setTimeout(() => {
          events = this.query(new State(new TimeSpan(begin, end)))
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

export const cleanupDraw = (clearScreen = true) => {
  const ctx = getDrawContext();
  clearScreen && ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.width);
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  if (window.strudelScheduler) {
    clearInterval(window.strudelScheduler);
  }
};

Pattern.prototype.onPaint = function (onPaint) {
  // this is evil! TODO: add pattern.context
  this.context = { onPaint };
  return this;
};

// const round = (x) => Math.round(x * 1000) / 1000;

// encapsulates starting and stopping animation frames
export class Framer {
  constructor(onFrame, onError) {
    this.onFrame = onFrame;
    this.onError = onError;
  }
  start() {
    const self = this;
    let frame = requestAnimationFrame(function updateHighlights(time) {
      try {
        self.onFrame(time);
      } catch (err) {
        self.onError(err);
      }
      frame = requestAnimationFrame(updateHighlights);
    });
    self.cancel = () => {
      cancelAnimationFrame(frame);
    };
  }
  stop() {
    if (this.cancel) {
      this.cancel();
    }
  }
}

// syncs animation frames to a cyclist scheduler
// see vite-vanilla-repl-cm6 for an example
export class Drawer {
  constructor(onDraw, drawTime) {
    this.visibleHaps = [];
    this.lastFrame = null;
    this.drawTime = drawTime;
    this.framer = new Framer(
      () => {
        if (!this.scheduler) {
          console.warn('Drawer: no scheduler');
          return;
        }
        const lookbehind = Math.abs(this.drawTime[0]);
        const lookahead = this.drawTime[1];
        // calculate current frame time (think right side of screen for pianoroll)
        const phase = this.scheduler.now() + lookahead;
        // first frame just captures the phase
        if (this.lastFrame === null) {
          this.lastFrame = phase;
          return;
        }
        // query haps from last frame till now. take last 100ms max
        const haps = this.scheduler.pattern.queryArc(Math.max(this.lastFrame, phase - 1 / 10), phase);
        this.lastFrame = phase;
        this.visibleHaps = (this.visibleHaps || [])
          // filter out haps that are too far in the past (think left edge of screen for pianoroll)
          .filter((h) => h.endClipped >= phase - lookbehind - lookahead)
          // add new haps with onset (think right edge bars scrolling in)
          .concat(haps.filter((h) => h.hasOnset()));
        const time = phase - lookahead;
        onDraw(this.visibleHaps, time, this);
      },
      (err) => {
        console.warn('draw error', err);
      },
    );
  }
  setDrawTime(drawTime) {
    this.drawTime = drawTime;
  }
  invalidate(scheduler = this.scheduler, t) {
    if (!scheduler) {
      return;
    }
    // TODO: scheduler.now() seems to move even when it's stopped, this hints at a bug...
    t = t ?? scheduler.now();
    this.scheduler = scheduler;
    let [_, lookahead] = this.drawTime;
    const [begin, end] = [Math.max(t, 0), t + lookahead + 0.1];
    // remove all future haps
    this.visibleHaps = this.visibleHaps.filter((h) => h.whole.begin < t);
    // query future haps
    const futureHaps = scheduler.pattern.queryArc(begin, end); // +0.1 = workaround for weird holes in query..
    // append future haps
    this.visibleHaps = this.visibleHaps.concat(futureHaps);
  }
  start(scheduler) {
    this.scheduler = scheduler;
    this.invalidate();
    this.framer.start();
  }
  stop() {
    if (this.framer) {
      this.framer.stop();
    }
  }
}
