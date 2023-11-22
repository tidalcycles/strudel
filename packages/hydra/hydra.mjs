import { getDrawContext } from '@strudel.cycles/core';

export async function initHydra(config) {
  if (!document.getElementById('hydra-canvas')) {
    const { canvas: testCanvas } = getDrawContext();
    await import('https://unpkg.com/hydra-synth');
    h = new Hydra({detectAudio: config?.audio });
    h.canvas.id = 'hydra-canvas';
    h.canvas.style.position = 'absolute';
    h.canvas.style.top = '0px';
    testCanvas.after(h.canvas);
  }
}

export const H = (p) => () => p.queryArc(getTime(), getTime())[0].value;
