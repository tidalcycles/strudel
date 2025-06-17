import { Pattern } from '@strudel/core';

Pattern.prototype.cyclecounter = function (options = {}) {
  return this.onPaint((ctx, time, haps, drawTime) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.font = options.font || '2em monospace';
    ctx.fillStyle = options.color || 'red';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'right';

    const div = options.div || 1;

    ctx.fillText('Cycle' + (div > 1 ? '/' + div : '') + ' ' + ((time / div) >> 0), ctx.canvas.width, ctx.canvas.height);
  });
};
