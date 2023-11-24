import { getDrawContext } from '@strudel.cycles/core';

let hydra;

function appendCanvas(c) {
  const { canvas: testCanvas } = getDrawContext();
  c.canvas.id = 'hydra-canvas';
  c.canvas.style.position = 'fixed';
  c.canvas.style.top = '0px';
  testCanvas.after(c.canvas);
  return testCanvas;
}

export async function initHydra(options = {detectAudio: false}) {
  //load and init hydra
  if (!document.getElementById('hydra-canvas')) {
    const { src = 'https://unpkg.com/hydra-synth', ...opts } = options;
    await import(src);
    hydra = new Hydra(opts);
    appendCanvas(hydra);
    // hydra.synth.s0.init({ src: testCanvas });  // is this needed?
  } else if (options?.detectAudio && !hydra?.detectAudio) {
    // if options.detectAudio is true
    // and current canvas des not detect audio
    //remove previous canvas without audio detection
    document.getElementById('hydra-canvas').remove();
    return initHydra(options);
  }
}

export const H = (p) => () => p.queryArc(getTime(), getTime())[0].value;
