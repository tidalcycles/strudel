import { getDrawContext } from '@strudel.cycles/core';

export async function initHydra() {
  if (!document.getElementById('hydra-canvas')) {
    const { canvas: testCanvas } = getDrawContext();
    await import('https://unpkg.com/hydra-synth');
    const hydraCanvas = testCanvas.cloneNode(true);
    hydraCanvas.id = 'hydra-canvas';
    testCanvas.after(hydraCanvas);
    new Hydra({ canvas: hydraCanvas, detectAudio: false });
    s0.init({ src: testCanvas });
  }
}

export const H = (p) => () => p.queryArc(getTime(), getTime())[0].value;
