let ac;
document.getElementById('play').addEventListener('click', async () => {
  ac = ac || new AudioContext();
  await ac.resume();
  await ac.audioWorklet.addModule('./worklet.js');
  const node = new AudioWorkletNode(ac, 'saw-processor');

  //let res = await fetch('./zigsaw/zigsaw.wasm');
  let res = await fetch('./csaw/csaw.wasm');
  //let res = await fetch('./rustsaw/pkg/rustsaw_bg.wasm');
  const buffer = await res.arrayBuffer();
  node.port.onmessage = (e) => {
    if (e.data === 'OK') {
      console.log('worklet ready');
    }
  };
  node.port.postMessage({ webassembly: buffer });
  node.connect(ac.destination);

  document.getElementById('freq').addEventListener('input', async (e) => {
    node.port.postMessage({ frequency: e.target.value });
  });
});
