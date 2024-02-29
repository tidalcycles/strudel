import { getDrawContext } from '@strudel/canvas';

let latestOptions;

function appendCanvas(c) {
  const { canvas: testCanvas } = getDrawContext();
  c.canvas.id = 'hydra-canvas';
  c.canvas.style.position = 'fixed';
  c.canvas.style.top = '0px';
  testCanvas.after(c.canvas);
  return testCanvas;
}

export async function initHydra(options = {}) {
  // reset if options have changed since last init
  if (latestOptions && JSON.stringify(latestOptions) !== JSON.stringify(options)) {
    document.getElementById('hydra-canvas').remove();
  }
  latestOptions = options;
  //load and init hydra
  if (!document.getElementById('hydra-canvas')) {
    console.log('reinit..');
    const {
      src = 'https://unpkg.com/hydra-synth',
      feedStrudel = false,
      ...hydraConfig
    } = { detectAudio: false, ...options };

    await import(/* @vite-ignore */ src);
    const hydra = new Hydra(hydraConfig);
    if (feedStrudel) {
      const { canvas } = getDrawContext();
      canvas.style.display = 'none';
      hydra.synth.s0.init({ src: canvas });
    }
    appendCanvas(hydra);
  }
}

export const H = (p) => () => p.queryArc(getTime(), getTime())[0].value;
