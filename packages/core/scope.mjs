import { Pattern } from './pattern.mjs';
import { getDrawContext } from './draw.mjs';
import { analyser } from '@strudel.cycles/webaudio';

export function drawTimeScope(
  analyser,
  { align = true, color = 'white', thickness = 3, scale = 1, pos = 0.75, next = 1 } = {},
) {
  const canvasCtx = getDrawContext();
  const dataArray = getAnalyzerData('time');

  canvasCtx.lineWidth = thickness;
  canvasCtx.strokeStyle = color;

  canvasCtx.beginPath();
  let canvas = canvasCtx.canvas;

  const bufferSize = analyser.frequencyBinCount;
  const triggerValue = 256 / 2;
  let triggerIndex = align
    ? Array.from(dataArray).findIndex((v, i, arr) => i && arr[i - 1] < triggerValue && v >= triggerValue)
    : 0;
  triggerIndex = Math.max(triggerIndex, 0); // fallback to 0 when no trigger is found

  const sliceWidth = (canvas.width * 1.0) / bufferSize;
  let x = 0;

  for (let i = triggerIndex; i < bufferSize; i++) {
    const v = dataArray[i] / 128.0;
    const y = (scale * (v - 1) + pos) * canvas.height;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  canvasCtx.stroke();
}

export function drawFrequencyScope(analyser, { color = 'white', scale = 1, pos = 0.75, lean = 0.5 } = {}) {
  const dataArray = getAnalyzerData('frequency');
  const canvasCtx = getDrawContext();
  const canvas = canvasCtx.canvas;

  canvasCtx.fillStyle = color;
  const bufferSize = analyser.frequencyBinCount;
  const sliceWidth = (canvas.width * 1.0) / bufferSize;

  let x = 0;
  for (let i = 0; i < bufferSize; i++) {
    const v = (dataArray[i] / 256.0) * scale;
    const h = v * canvas.height;
    const y = (pos - v * lean) * canvas.height;

    canvasCtx.fillRect(x, y, Math.max(sliceWidth, 1), h);
    x += sliceWidth;
  }
}

function clearScreen(smear = 0, smearRGB = `0,0,0`) {
  const canvasCtx = getDrawContext();
  if (!smear) {
    canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
  } else {
    canvasCtx.fillStyle = `rgba(${smearRGB},${1 - smear})`;
    canvasCtx.fillRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
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
