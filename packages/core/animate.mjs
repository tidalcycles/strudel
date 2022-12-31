import { controls, Pattern, getDrawContext, silence, scheduler } from './index.mjs';
const { createParams } = controls;

Pattern.prototype.animate = function (callback) {
  window.frame && cancelAnimationFrame(window.frame);
  const ctx = getDrawContext();
  const { clientWidth: ww, clientHeight: wh } = ctx.canvas;
  const render = () => {
    // const render = (t) => {
    // t = Math.round(t);
    // const frame = this.slow(1000).queryArc(t, t);
    const t = scheduler.now();
    const frame = this.queryArc(t, t);
    ctx.fillStyle = '#20001005';
    ctx.fillRect(0, 0, ww, wh);
    frame.forEach((f) => {
      let { x, y, w, h, s, r, a = 0, fill = 'darkseagreen' } = f.value;
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

export const { x, y, w, h, a, r, fill } = createParams('x', 'y', 'w', 'h', 'a', 'r', 'fill');
