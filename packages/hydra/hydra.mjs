import { getDrawContext } from '@strudel/draw';
import { controls, getTime, reify } from '@strudel/core';

let latestOptions;
let hydra;

export async function initHydra(options = {}) {
  // reset if options have changed since last init
  if (latestOptions && JSON.stringify(latestOptions) !== JSON.stringify(options)) {
    document.getElementById('hydra-canvas')?.remove();
  }
  latestOptions = options;
  //load and init hydra
  if (!document.getElementById('hydra-canvas')) {
    const {
      src = 'https://unpkg.com/hydra-synth',
      feedStrudel = false,
      contextType = 'webgl',
      pixelRatio = 1,
      pixelated = true,
      ...hydraConfig
    } = {
      detectAudio: false,
      ...options,
    };
    const { canvas } = getDrawContext('hydra-canvas', { contextType, pixelRatio, pixelated });
    hydraConfig.canvas = canvas;

    await import(/* @vite-ignore */ src);
    /* eslint-disable-next-line */
    hydra = new Hydra(hydraConfig);
    if (feedStrudel) {
      const { canvas } = getDrawContext();
      canvas.style.display = 'none';
      hydra.synth.s0.init({ src: canvas });
    }
  }
}

export function clearHydra() {
  if (hydra) {
    hydra.hush();
  }
  globalThis.s0?.clear();
  document.getElementById('hydra-canvas')?.remove();
  globalThis.speed = controls.speed;
  globalThis.shape = controls.shape;
}

export const H = (p) => () => reify(p).queryArc(getTime(), getTime())[0].value;
