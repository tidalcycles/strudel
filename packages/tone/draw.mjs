import { Tone } from '@strudel/tone';
import { Pattern } from '@strudel/core';

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

Pattern.prototype.draw = function (callback, cycleSpan, lookaheadCycles = 1) {
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const ctx = getDrawContext();
  let cycle,
    events = [];
  const animate = (time) => {
    const t = Tone.getTransport().seconds;
    if (cycleSpan) {
      const currentCycle = Math.floor(t / cycleSpan);
      if (cycle !== currentCycle) {
        cycle = currentCycle;
        const begin = currentCycle * cycleSpan;
        const end = (currentCycle + lookaheadCycles) * cycleSpan;
        events = this._asNumber(true) // true = silent error
          .query(new State(new TimeSpan(begin, end)))
          .filter((event) => event.part.begin.equals(event.whole.begin));
      }
    }
    callback(ctx, events, t, cycleSpan, time);
    window.strudelAnimation = requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  return this;
};

export const cleanup = () => {
  const ctx = getDrawContext();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  if (window.strudelScheduler) {
    clearInterval(window.strudelScheduler);
  }
};
