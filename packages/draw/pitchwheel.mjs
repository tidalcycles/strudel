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
  haps,
  ctx,
  id,
  hapcircles = 1,
  circle = 0,
  edo = 12,
  root = c,
  thickness = 3,
  hapRadius = 6,
  mode = 'flake',
  margin = 10,
} = {}) {
  const connectdots = mode === 'polygon';
  const centerlines = mode === 'flake';
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
      const angle = freq2angle(root * Math.pow(2, i / edo), root);
      const [x, y] = circlePos(centerX, centerY, radius, angle);
      ctx.beginPath();
      ctx.arc(x, y, hapRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.stroke();
  }

  let shape = [];
  ctx.lineWidth = hapRadius;
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
    ctx.strokeStyle = hapColor;
    ctx.fillStyle = hapColor;
    const { velocity = 1, gain = 1 } = hap.value || {};
    const alpha = velocity * gain;
    ctx.globalAlpha = alpha;
    shape.push([x, y, angle, hapColor, alpha]);
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
  if (connectdots && shape.length) {
    shape = shape.sort((a, b) => a[2] - b[2]);
    ctx.beginPath();
    ctx.moveTo(shape[0][0], shape[0][1]);
    shape.forEach(([x, y, _, color, alpha]) => {
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(shape[0][0], shape[0][1]);
    ctx.stroke();
  }

  return;
}

/**
 * Renders a pitch circle to visualize frequencies within one octave
 * @name pitchwheel
 * @param {number} hapcircles
 * @param {number} circle
 * @param {number} edo
 * @param {string} root
 * @param {number} thickness
 * @param {number} hapRadius
 * @param {string} mode
 * @param {number} margin
 * @example
 * n("0 .. 12").scale("C:chromatic")
 * .s("sawtooth")
 * .lpf(500)
 * ._pitchwheel()
 */
Pattern.prototype.pitchwheel = function (options = {}) {
  let { ctx = getDrawContext(), id = 1 } = options;
  return this.tag(id).onPaint((_, time, haps) =>
    pitchwheel({
      ...options,
      time,
      ctx,
      haps: haps.filter((hap) => hap.isActive(time)),
      id,
    }),
  );
};
