export async function initHydra() {
  if (!document.getElementById('hydra-canvas')) {
    await import('https://unpkg.com/hydra-synth');
    const testCanvas = document.getElementById('test-canvas');
    const hydraCanvas = testCanvas.cloneNode(true);
    hydraCanvas.id = 'hydra-canvas';
    testCanvas.after(hydraCanvas);
    new Hydra({ canvas: hydraCanvas, detectAudio: false });
    s0.init({ src: testCanvas });
  }
}
