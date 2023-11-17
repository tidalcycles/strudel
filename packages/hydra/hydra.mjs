import { getDrawContext } from '@strudel.cycles/core';

export async function initHydra(
  options = {
    src: 'https://unpkg.com/hydra-synth',
    detectAudio: false,
  },
) {
  if (!document.getElementById('hydra-canvas')) {
    const { canvas: testCanvas } = getDrawContext();
    const { src, ...opts } = options;
    await import(src);
    const hydraCanvas = testCanvas.cloneNode(true);
    hydraCanvas.id = 'hydra-canvas';
    testCanvas.after(hydraCanvas);
    new Hydra(Object.assign({ canvas: hydraCanvas }, opts));
    s0.init({ src: testCanvas });
  }
}

export const H = (p) => () => p.queryArc(getTime(), getTime())[0].value;
