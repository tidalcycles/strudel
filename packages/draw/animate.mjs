import { Pattern, silence, register, pure, createParams } from '@strudel/core';
import { getDrawContext } from './draw.mjs';

let clearColor = '#22222210';

Pattern.prototype.animate = function ({ callback, sync = false, smear = 0.5 } = {}) {
  window.frame && cancelAnimationFrame(window.frame);
  const ctx = getDrawContext();
  let { clientWidth: ww, clientHeight: wh } = ctx.canvas;
  ww *= window.devicePixelRatio;
  wh *= window.devicePixelRatio;
  let smearPart = smear === 0 ? '99' : Number((1 - smear) * 100).toFixed(0);
  smearPart = smearPart.length === 1 ? `0${smearPart}` : smearPart;
  clearColor = `#200010${smearPart}`;
  const render = (t) => {
    let frame;
    /*     if (sync) {
      t = scheduler.now();
      frame = this.queryArc(t, t);
    } else { */
    t = Math.round(t);
    frame = this.slow(1000).queryArc(t, t);
    // }
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, ww, wh);
    frame.forEach((f) => {
      let { x, y, w, h, s, r, angle = 0, fill = 'darkseagreen' } = f.value;
      w *= ww;
      h *= wh;
      if (r !== undefined && angle !== undefined) {
        const radians = angle * 2 * Math.PI;
        const [cx, cy] = [(ww - w) / 2, (wh - h) / 2];
        x = cx + Math.cos(radians) * r * cx;
        y = cy + Math.sin(radians) * r * cy;
      } else {
        x *= ww - w;
        y *= wh - h;
      }
      const val = { ...f.value, x, y, w, h };
      ctx.fillStyle = fill;
      if (s === 'rect') {
        ctx.fillRect(x, y, w, h);
      } else if (s === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
      }
      callback && callback(ctx, val, f);
    });
    window.frame = requestAnimationFrame(render);
  };
  window.frame = requestAnimationFrame(render);
  return silence;
};

export const { x, y, w, h, angle, r, fill, smear } = createParams('x', 'y', 'w', 'h', 'angle', 'r', 'fill', 'smear');

export const rescale = register('rescale', function (f, pat) {
  return pat.mul(x(f).w(f).y(f).h(f));
});

export const moveXY = register('moveXY', function (dx, dy, pat) {
  return pat.add(x(dx).y(dy));
});

export const zoomIn = register('zoomIn', function (f, pat) {
  const d = pure(1).sub(f).div(2);
  return pat.rescale(f).move(d, d);
});
