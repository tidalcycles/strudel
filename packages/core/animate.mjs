import { controls, Pattern, getDrawContext, silence, scheduler } from './index.mjs';
const { createParams } = controls;

let clearColor = '#20001010';
let currentSmear = 0.5;
export let syncAnimationWithScheduler = true;

Pattern.prototype.animate = function (callback) {
  window.frame && cancelAnimationFrame(window.frame);
  const ctx = getDrawContext();
  const { clientWidth: ww, clientHeight: wh } = ctx.canvas;
  const render = (t) => {
    let frame;
    if (syncAnimationWithScheduler) {
      t = scheduler.now();
      frame = this.queryArc(t, t);
    } else {
      t = Math.round(t);
      frame = this.slow(1000).queryArc(t, t);
    }
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, ww, wh);
    frame.forEach((f) => {
      let { x, y, w, h, s, r, a = 0, fill = 'darkseagreen', smear } = f.value;
      if (smear && smear !== currentSmear) {
        currentSmear = smear;
        let smearPart = Number((1 - smear) * 100).toFixed(0);
        smearPart = smearPart.length === 1 ? `0${smearPart}` : smearPart;
        clearColor = `#200010${smearPart}`;
      }
      w *= ww;
      h *= wh;
      if (r !== undefined && a !== undefined) {
        const radians = a * 2 * Math.PI;
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

export const { x, y, w, h, a, r, fill, smear } = createParams('x', 'y', 'w', 'h', 'a', 'r', 'fill', 'smear');
