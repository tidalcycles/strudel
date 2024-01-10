let ac;
document.getElementById('play').addEventListener('click', async () => {
  ac = ac || new AudioContext();
  await ac.resume();
  await ac.audioWorklet.addModule('./worklet.js');
  const node = new AudioWorkletNode(ac, 'saw-processor');

  let res = await fetch('./dsp.wasm');
  const buffer = await res.arrayBuffer();
  node.port.onmessage = (e) => {
    if (e.data === 'OK') {
      console.log('worklet ready');
    }
  };
  node.port.postMessage({ webassembly: buffer });
  node.connect(ac.destination);
});
