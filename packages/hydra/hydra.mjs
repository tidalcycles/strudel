import { getDrawContext } from '@strudel.cycles/core';

let options = '';

export async function initHydra(config) {
  //load and init hydra
  if (!document.getElementById('hydra-canvas')) {
    const { canvas: testCanvas } = getDrawContext();
    await import('https://unpkg.com/hydra-synth');
    h = new Hydra({ detectAudio: config?.audio });
    h.canvas.id = 'hydra-canvas';
    h.canvas.style.position = 'absolute';
    h.canvas.style.top = '0px';
    testCanvas.after(h.canvas);
  }

  // update options
  if (options != JSON.stringify(config)) {
    options = JSON.stringify(config);

    new Hydra({
      canvas: document.getElementById('hydra-canvas'),
      detectAudio: config?.audio,
    });
  }
}

export const H = (p) => () => p.queryArc(getTime(), getTime())[0].value;
