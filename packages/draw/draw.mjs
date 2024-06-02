/*
draw.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/canvas/draw.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, getTime, State, TimeSpan } from '@strudel/core';

export const getDrawContext = (id = 'test-canvas', options) => {
  let { contextType = '2d', pixelated = false, pixelRatio = window.devicePixelRatio } = options || {};
  let canvas = document.querySelector('#' + id);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    canvas.style = 'pointer-events:none;width:100%;height:100%;position:fixed;top:0;left:0';
    pixelated && (canvas.style.imageRendering = 'pixelated');
    document.body.prepend(canvas);
    let timeout;
    window.addEventListener('resize', () => {
      timeout && clearTimeout(timeout);
      timeout = setTimeout(() => {
        canvas.width = window.innerWidth * pixelRatio;
        canvas.height = window.innerHeight * pixelRatio;
      }, 200);
    });
  }
  return canvas.getContext(contextType);
};

let animationFrames = {};
function stopAnimationFrame(id) {
  if (animationFrames[id] !== undefined) {
    cancelAnimationFrame(animationFrames[id]);
    delete animationFrames[id];
  }
}
function stopAllAnimations(replID) {
  Object.keys(animationFrames).forEach((id) => (!replID || id.startsWith(replID)) && stopAnimationFrame(id));
}

let memory = {};
Pattern.prototype.draw = function (fn, options) {
  if (typeof window === 'undefined') {
    return this;
  }
  let { id = 1, lookbehind = 0, lookahead = 0 } = options;
  let __t = Math.max(getTime(), 0);
  stopAnimationFrame(id);
  lookbehind = Math.abs(lookbehind);
  // init memory, clear future haps of old pattern
  memory[id] = (memory[id] || []).filter((h) => !h.isInFuture(__t));
  let newFuture = this.queryArc(__t, __t + lookahead).filter((h) => h.hasOnset());
  memory[id] = memory[id].concat(newFuture);

  let last;
  const animate = () => {
    const _t = getTime();
    const t = _t + lookahead;
    // filter out haps that are too far in the past
    memory[id] = memory[id].filter((h) => h.isInNearPast(lookbehind, _t));
    // begin where we left off in last frame, but max -0.1s (inactive tab throttles to 1fps)
    let begin = Math.max(last || t, t - 1 / 10);
    const haps = this.queryArc(begin, t).filter((h) => h.hasOnset());
    memory[id] = memory[id].concat(haps);
    last = t; // makes sure no haps are missed
    fn(memory[id], _t, t, this);
    animationFrames[id] = requestAnimationFrame(animate);
  };
  animationFrames[id] = requestAnimationFrame(animate);
  return this;
};

export const cleanupDraw = (clearScreen = true, id) => {
  const ctx = getDrawContext();
  clearScreen && ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  stopAllAnimations(id);
};

Pattern.prototype.onPaint = function (painter) {
  return this.withState((state) => {
    if (!state.controls.painters) {
      state.controls.painters = [];
    }
    state.controls.painters.push(painter);
  });
};

Pattern.prototype.getPainters = function () {
  let painters = [];
  this.queryArc(0, 0, { painters });
  return painters;
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
    this.painters = [];
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
        onDraw(this.visibleHaps, time, this, this.painters);
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
    // +0.1 = workaround for weird holes in query..
    const [begin, end] = [Math.max(t, 0), t + lookahead + 0.1];
    // remove all future haps
    this.visibleHaps = this.visibleHaps.filter((h) => h.whole.begin < t);
    this.painters = []; // will get populated by .onPaint calls attached to the pattern
    // query future haps
    const futureHaps = scheduler.pattern.queryArc(begin, end, { painters: this.painters });
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

export function getComputedPropertyValue(name) {
  if (typeof window === 'undefined') {
    return '#fff';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

let theme = {
  background: '#222',
  foreground: '#75baff',
  caret: '#ffcc00',
  selection: 'rgba(128, 203, 196, 0.5)',
  selectionMatch: '#036dd626',
  lineHighlight: '#00000050',
  gutterBackground: 'transparent',
  gutterForeground: '#8a919966',
};
export function getTheme() {
  return theme;
}
export function setTheme(_theme) {
  theme = _theme;
}
