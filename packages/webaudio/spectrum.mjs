import { Pattern, clamp } from '@strudel/core';
import { getDrawContext, getTheme } from '@strudel/draw';
import { analysers, getAnalyzerData } from 'superdough';

/**
 * Renders a spectrum analyzer for the incoming audio signal.
 * @name spectrum
 * @param {object} config optional config with options:
 * @param {integer} thickness line thickness in px (default 3)
 * @param {integer} speed scroll speed (default 1)
 * @param {integer} min min db (default -80)
 * @param {integer} max max db (default 0)
 * @example
 * n("<0 4 <2 3> 1>*3")
 * .off(1/8, add(n(5)))
 * .off(1/5, add(n(7)))
 * .scale("d3:minor:pentatonic")
 * .s('sine')
 * .dec(.3).room(.5)
 * ._spectrum()
 */
let latestColor = {};
Pattern.prototype.spectrum = function (config = {}) {
  let id = config.id ?? 1;
  return this.analyze(id).draw(
    (haps) => {
      config.color = haps[0]?.value?.color || latestColor[id] || getTheme().foreground;
      latestColor[id] = config.color;
      drawSpectrum(analysers[id], config);
    },
    { id },
  );
};

Pattern.prototype.scope = Pattern.prototype.tscope;

const lastFrames = new Map();

function drawSpectrum(
  analyser,
  { thickness = 3, speed = 1, min = -80, max = 0, ctx = getDrawContext(), id = 1, color } = {},
) {
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;

  if (!analyser) {
    // if analyser is undefined, draw straight line
    // it may be undefined when no sound has been played yet
    return;
  }
  const scrollSize = speed;
  const dataArray = getAnalyzerData('frequency', id);
  const canvas = ctx.canvas;
  ctx.fillStyle = color;
  const bufferSize = analyser.frequencyBinCount;
  let imageData = lastFrames.get(id) || ctx.getImageData(0, 0, canvas.width, canvas.height);
  lastFrames.set(id, imageData);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.putImageData(imageData, -scrollSize, 0);
  let q = canvas.width - speed;
  for (let i = 0; i < bufferSize; i++) {
    const normalized = clamp((dataArray[i] - min) / (max - min), 0, 1);
    ctx.globalAlpha = normalized;
    const next = (Math.log(i + 1) / Math.log(bufferSize)) * canvas.height;
    const size = 2; //next - pos;
    ctx.fillRect(q, canvas.height - next, scrollSize, size);
  }
  lastFrames.set(id, ctx.getImageData(0, 0, canvas.width, canvas.height));
}
