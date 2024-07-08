import { Pattern, clamp } from '@strudel/core';
import { getDrawContext, getTheme } from '@strudel/draw';
import { analysers, getAnalyzerData } from 'superdough';

export function drawTimeScope(
  analyser,
  {
    align = true,
    color = 'white',
    thickness = 3,
    scale = 0.25,
    pos = 0.75,
    trigger = 0,
    ctx = getDrawContext(),
    id = 1,
  } = {},
) {
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  let canvas = ctx.canvas;

  if (!analyser) {
    // if analyser is undefined, draw straight line
    // it may be undefined when no sound has been played yet
    ctx.beginPath();
    let y = pos * canvas.height;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    return;
  }
  const dataArray = getAnalyzerData('time', id);

  ctx.beginPath();

  const bufferSize = analyser.frequencyBinCount;
  let triggerIndex = align
    ? Array.from(dataArray).findIndex((v, i, arr) => i && arr[i - 1] > -trigger && v <= -trigger)
    : 0;
  triggerIndex = Math.max(triggerIndex, 0); // fallback to 0 when no trigger is found

  const sliceWidth = (canvas.width * 1.0) / bufferSize;
  let x = 0;
  for (let i = triggerIndex; i < bufferSize; i++) {
    const v = dataArray[i] + 1;
    const y = (pos - scale * (v - 1)) * canvas.height;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  ctx.stroke();
}

export function drawFrequencyScope(
  analyser,
  { color = 'white', scale = 0.25, pos = 0.75, lean = 0.5, min = -150, max = 0, ctx = getDrawContext(), id = 1 } = {},
) {
  if (!analyser) {
    ctx.beginPath();
    let y = pos * canvas.height;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    return;
  }
  const dataArray = getAnalyzerData('frequency', id);
  const canvas = ctx.canvas;

  ctx.fillStyle = color;
  const bufferSize = analyser.frequencyBinCount;
  const sliceWidth = (canvas.width * 1.0) / bufferSize;

  let x = 0;
  for (let i = 0; i < bufferSize; i++) {
    const normalized = clamp((dataArray[i] - min) / (max - min), 0, 1);
    const v = normalized * scale;
    const h = v * canvas.height;
    const y = (pos - v * lean) * canvas.height;

    ctx.fillRect(x, y, Math.max(sliceWidth, 1), h);
    x += sliceWidth;
  }
}

function clearScreen(smear = 0, smearRGB = `0,0,0`, ctx = getDrawContext()) {
  if (!smear) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  } else {
    ctx.fillStyle = `rgba(${smearRGB},${1 - smear})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

/**
 * Renders an oscilloscope for the frequency domain of the audio signal.
 * @name fscope
 * @param {string} color line color as hex or color name. defaults to white.
 * @param {number} scale scales the y-axis. Defaults to 0.25
 * @param {number} pos y-position relative to screen height. 0 = top, 1 = bottom of screen
 * @param {number} lean y-axis alignment where 0 = top and 1 = bottom
 * @param {number} min min value
 * @param {number} max max value
 * @example
 * s("sawtooth").fscope()
 */
Pattern.prototype.fscope = function (config = {}) {
  let id = config.id ?? 1;
  return this.analyze(id).draw(
    () => {
      clearScreen(config.smear, '0,0,0', config.ctx);
      analysers[id] && drawFrequencyScope(analysers[id], config);
    },
    { id },
  );
};

/**
 * Renders an oscilloscope for the time domain of the audio signal.
 * @name scope
 * @synonyms tscope
 * @param {object} config optional config with options:
 * @param {boolean} align if 1, the scope will be aligned to the first zero crossing. defaults to 1
 * @param {string} color line color as hex or color name. defaults to white.
 * @param {number} thickness line thickness. defaults to 3
 * @param {number} scale scales the y-axis. Defaults to 0.25
 * @param {number} pos y-position relative to screen height. 0 = top, 1 = bottom of screen
 * @param {number} trigger amplitude value that is used to align the scope. defaults to 0.
 * @example
 * s("sawtooth")._scope()
 */
let latestColor = {};
Pattern.prototype.tscope = function (config = {}) {
  let id = config.id ?? 1;
  return this.analyze(id).draw(
    (haps) => {
      config.color = haps[0]?.value?.color || getTheme().foreground;
      latestColor[id] = config.color;
      clearScreen(config.smear, '0,0,0', config.ctx);
      drawTimeScope(analysers[id], config);
    },
    { id },
  );
};

Pattern.prototype.scope = Pattern.prototype.tscope;
