import { Pattern, getDrawContext, clamp } from '@strudel.cycles/core';
import { analyser, getAnalyzerData } from 'superdough';

export function drawTimeScope(
  analyser,
  { align = true, color = 'white', thickness = 3, scale = 0.25, pos = 0.75, next = 1, trigger = 0 } = {},
) {
  const ctx = getDrawContext();
  const dataArray = getAnalyzerData('time');

  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;

  ctx.beginPath();
  let canvas = ctx.canvas;

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
  { color = 'white', scale = 0.25, pos = 0.75, lean = 0.5, min = -150, max = 0 } = {},
) {
  const dataArray = getAnalyzerData('frequency');
  const ctx = getDrawContext();
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

function clearScreen(smear = 0, smearRGB = `0,0,0`) {
  const ctx = getDrawContext();
  if (!smear) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  } else {
    ctx.fillStyle = `rgba(${smearRGB},${1 - smear})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

Pattern.prototype.fscope = function (config = {}) {
  return this.analyze(1).draw(() => {
    clearScreen(config.smear);
    analyser && drawFrequencyScope(analyser, config);
  });
};

Pattern.prototype.tscope = function (config = {}) {
  return this.analyze(1).draw(() => {
    clearScreen(config.smear);
    analyser && drawTimeScope(analyser, config);
  });
};

Pattern.prototype.scope = Pattern.prototype.tscope;
