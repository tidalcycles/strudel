import { Pattern } from './pattern.mjs';
import { getDrawContext } from './draw.mjs';
import { analyser } from '@strudel.cycles/webaudio';

export function drawTimeScope(analyser, dataArray, { align = true, color = 'white', thickness = 2 } = {}) {
  const canvasCtx = getDrawContext();

  canvasCtx.lineWidth = thickness;
  canvasCtx.strokeStyle = color;

  canvasCtx.beginPath();
  let canvas = canvasCtx.canvas;

  const bufferSize = analyser.frequencyBinCount;
  const triggerValue = 256 / 2;
  const triggerIndex = align
    ? Array.from(dataArray).findIndex((v, i, arr) => i && arr[i - 1] < triggerValue && v >= triggerValue)
    : 0;

  const sliceWidth = (canvas.width * 1.0) / bufferSize;
  let x = 0;

  for (let i = triggerIndex; i < bufferSize; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * (canvas.height / 2)) / 2 + canvas.height / 2;
    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  canvasCtx.stroke();
}

Pattern.prototype.scope = function (config = {}) {
  return this.analyze(1).draw((ctx) => {
    let data = getAnalyzerData('time');
    const { smear = 0 } = config;
    if (!smear) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    } else {
      ctx.fillStyle = `rgba(0,0,0,${1 - smear})`;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
    data && drawTimeScope(analyser, data, config);
  });
};
