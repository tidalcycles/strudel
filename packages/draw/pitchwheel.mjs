import { Pattern, midiToFreq, getFrequency } from '@strudel/core';
import { getTheme, getDrawContext } from './draw.mjs';

const c = midiToFreq(36);

const circlePos = (cx, cy, radius, angle) => {
  angle = angle * Math.PI * 2;
  const x = Math.sin(angle) * radius + cx;
  const y = Math.cos(angle) * radius + cy;
  return [x, y];
};

const freq2angle = (freq, root) => {
  return 0.5 - (Math.log2(freq / root) % 1);
};

export function pitchwheel({
  time,
  haps,
  ctx,
  id,
  connectdots = 0,
  centerlines = 1,
  hapcircles = 1,
  circle = 0,
  edo = 12,
  root = c,
  thickness = 4,
  hapRadius = 4,
  margin = 10,
} = {}) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  const color = getTheme().foreground;

  const size = Math.min(w, h);
  const radius = size / 2 - thickness / 2 - hapRadius - margin;
  const centerX = w / 2;
  const centerY = h / 2;

  if (id) {
    haps = haps.filter((hap) => hap.hasTag(id));
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 1;
  ctx.lineWidth = thickness;

  if (circle) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  if (edo) {
    Array.from({ length: edo }, (_, i) => {
      ctx.beginPath();
      const angle = freq2angle(root * Math.pow(2, i / edo), root);
      const [x, y] = circlePos(centerX, centerY, radius, angle);
      ctx.arc(x, y, hapRadius, 0, 2 * Math.PI);
      ctx.stroke();
    });
  }

  let shape = [];
  haps.forEach((hap) => {
    let freq;
    try {
      freq = getFrequency(hap);
    } catch (err) {
      return;
    }
    const angle = freq2angle(freq, root);
    const [x, y] = circlePos(centerX, centerY, radius, angle);
    const hapColor = hap.value.color || color;
    shape.push([x, y]);
    ctx.strokeStyle = hapColor;
    ctx.fillStyle = hapColor;
    const { velocity = 1, gain = 1 } = hap.value || {};
    ctx.globalAlpha = velocity * gain;
    ctx.beginPath();
    if (hapcircles) {
      ctx.moveTo(x + hapRadius, y);
      ctx.arc(x, y, hapRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (centerlines) {
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  ctx.strokeStyle = color;
  ctx.globalAlpha = 1;
  if (shape.length && connectdots) {
    ctx.beginPath();
    ctx.moveTo(shape[0][0], shape[0][1]);
    shape.forEach(([x, y]) => {
      ctx.lineTo(x, y);
    });
    ctx.lineTo(shape[0][0], shape[0][1]);
    ctx.stroke();
  }

  return;
}

Pattern.prototype.pitchwheel = function (options = {}) {
  let { ctx = getDrawContext(), id = 1 } = options;
  this.onPaint((_, time, haps) =>
    pitchwheel({
      ...options,
      time,
      ctx,
      haps: haps.filter((hap) => hap.isActive(time)),
      id,
    }),
  );
  return this;
};
