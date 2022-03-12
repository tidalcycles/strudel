import * as Tone from 'tone';
import { Pattern } from '../../strudel.mjs';

export const getDrawContext = (id = 'test-canvas') => {
  let canvas = document.querySelector('#' + id);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style = 'pointer-events:none;width:100%;height:100%;position:fixed;top:0;left:0';
    document.body.prepend(canvas);
  }
  return canvas.getContext('2d');
};

Pattern.prototype.draw = function (callback, duration) {
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const ctx = getDrawContext();
  let cycle, events;
  const animate = (time) => {
    const t = Tone.getTransport().seconds;
    const currentCycle = Math.floor(t / duration);
    if (cycle !== currentCycle) {
      cycle = currentCycle;
      const begin = currentCycle * duration;
      const end = (currentCycle + 2) * duration;
      events = this.add(0).query(new State(new TimeSpan(begin, end)));
    }
    callback(ctx, events, t, time);
    window.strudelAnimation = requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
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
