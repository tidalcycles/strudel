import { Pattern } from '../core/strudel.mjs';
import { mod } from '../../packages/core/util.mjs';

function edo(name) {
  if (!/^[1-9]+[0-9]*edo$/.test(name)) {
    throw new Error('not an edo scale: "' + name + '"');
  }
  const [_, divisions] = name.match(/^([1-9]+[0-9]*)edo$/);
  return Array.from({ length: divisions }, (_, i) => Math.pow(2, i / divisions));
}

const presets = {
  '12ji': [1 / 1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 16 / 9, 15 / 8],
};

function withBase(freq, scale) {
  return scale.map((r) => r * freq);
}

const defaultBase = 220;

function getXenScale(scale, indices) {
  if (typeof scale === 'string') {
    if (/^[1-9]+[0-9]*edo$/.test(scale)) {
      scale = edo(scale);
    } else if (presets[scale]) {
      scale = presets[scale];
    } else {
      throw new Error('unknown scale name: "' + scale + '"');
    }
  }
  scale = withBase(defaultBase, scale);
  if (!indices) {
    return scale;
  }
  return scale.filter((_, i) => indices.includes(i));
}

function xenOffset(xenScale, offset, index = 0) {
  const i = mod(index + offset, xenScale.length);
  const oct = Math.floor(offset / xenScale.length);
  return xenScale[i] * Math.pow(2, oct);
}

// scaleNameOrRatios: string || number[], steps?: number
Pattern.prototype._xen = function (scaleNameOrRatios, steps) {
  return this._asNumber()._withEvent((event) => {
    const scale = getXenScale(scaleNameOrRatios);
    steps = steps || scale.length;
    const frequency = xenOffset(scale, event.value);
    return event.withValue(() => frequency).setContext({ ...event.context, type: 'frequency' });
  });
};

Pattern.prototype.tuning = function (steps) {
  return this._asNumber()._withEvent((event) => {
    const frequency = xenOffset(steps, event.value);
    return event.withValue(() => frequency).setContext({ ...event.context, type: 'frequency' });
  });
};
Pattern.prototype.define('xen', (scale, pat) => pat.xen(scale), { composable: true, patternified: true });
// Pattern.prototype.define('tuning', (scale, pat) => pat.xen(scale), { composable: true, patternified: false });
