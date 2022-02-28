import { Pattern } from '../../strudel.mjs';
import { mod } from '../../util.mjs';

function edo(name) {
  if (!/^[1-9]+edo$/.test(name)) {
    throw new Error('not an edo scale: "' + name + '"');
  }
  const [_, divisions] = name.match(/^([1-9]+)edo$/);
  return Array.from({ length: divisions }, (_, i) => Math.pow(2, i / divisions));
}

function getXenScale(scale, indices) {
  if (typeof scale === 'string') {
    if (/^[1-9]+edo$/.test(scale)) {
      return edo(scale);
    }
    throw new Error('unknown scale name: "' + scale + '"');
  }
  if (!indices) {
    return scale;
  }
  return scale.filter((_, i) => indices.includes(i));
}

function xenOffset(xenScale, offset, index = 0) {
  const i = mod(index + offset, xenScale.length);
  const oct = Math.floor(offset / xenScale.length);
  return xenScale[i] * 440 * Math.pow(2, oct);
}

Pattern.prototype._xen = function (scaleNameOrRatios) {
  return this._asNumber()._withEvent((event) => {
    const frequency = xenOffset(getXenScale(scaleNameOrRatios), event.value);
    return event.withValue(() => frequency).setContext({ ...event.context, type: 'frequency' });
  });
};
Pattern.prototype.define('xen', (scale, pat) => pat.xen(scale), { composable: true, patternified: true });
