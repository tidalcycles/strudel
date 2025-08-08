export const laserclock = ({ onTick, audioContext }) => {
  const ready = new Promise((resolve) => {
    const workletCode = `class LaserClock extends AudioWorkletProcessor {
  constructor() {
    super();
    this.block = 0;
    this.tick = 0;
    this.started = false;
    this.blocksPerCallback = 20;
    this.port.onmessage = (e) => {
      switch (e.data) {
        case "start":
          console.log('start!')
          this.started = true;
          break;
        case "stop":
          console.log('stop!')
          this.started = false;
          this.block = 0;
          this.tick = 0;
          break;
      }
    };
  }
  process(inputs, outputs, parameters) {
    if(!this.started) {
      return true;
    }
    if(this.block % this.blocksPerCallback === 0) {
      this.port.postMessage({tick: this.tick, currentTime});
      this.tick++;
    }
    this.block++;
    return true;
  }
}
registerProcessor("laserclock-processor", LaserClock);`;
    const dataURL = `data:text/javascript;base64,${btoa(workletCode)}`;
    audioContext.audioWorklet.addModule(dataURL).then(() => {
      const clock = new AudioWorkletNode(audioContext, 'laserclock-processor');
      clock.port.onmessage = (e) => onTick(e.data);
      clock.connect(audioContext.destination);
      resolve(clock);
    });
  });
  const start = () => ready.then((clock) => clock.port.postMessage('start'));
  const stop = () => ready.then((clock) => clock.port.postMessage('stop'));
  return { ready, start, stop };
};
