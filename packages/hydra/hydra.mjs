import { getDrawContext } from '@strudel.cycles/core';

let audio = false;
let hydra;

function appendCanvas(c){
  const { canvas: testCanvas } = getDrawContext();
  c.canvas.id = 'hydra-canvas';
  c.canvas.style.position = 'absolute';
  c.canvas.style.top = '0px';
  testCanvas.after(c.canvas);
}

export async function initHydra(config) {
  audio = config?.audio || false;
  //load and init hydra
  if (!document.getElementById('hydra-canvas')) {
    await import('https://unpkg.com/hydra-synth');
    hydra = new Hydra({ detectAudio: audio });
    appendCanvas(hydra);
  }

  // if config.audio is true
  // and current canvas des not detect audio
  if (config?.audio && !hydra.detectAudio ){
    //remove previous canvas without audio detection
    document.getElementById('hydra-canvas').remove()
    // create and append a new audio responsive canvas
    hydra = new Hydra({ detectAudio: audio});
    appendCanvas(hydra)
  }
}

export const H = (p) => () => p.queryArc(getTime(), getTime())[0].value;
