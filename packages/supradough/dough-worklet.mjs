import { Dough } from './dough.mjs';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

class DoughProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.dough = new Dough(sampleRate, currentTime);
    this.port.onmessage = (event) => {
      if (event.data.spawn) {
        this.dough.scheduleSpawn(event.data.spawn);
      } else if (event.data.sample) {
        this.dough.loadSample(event.data.sample, event.data.channels, event.data.sampleRate);
      } else if (event.data.samples) {
        event.data.samples.forEach(([name, channels, sampleRate]) => {
          this.dough.loadSample(name, channels, sampleRate);
        });
      } else {
        console.log('unrecognized event type', event.data);
      }
    };
  }
  process(inputs, outputs, params) {
    if (this.disconnected) {
      return false;
    }
    const output = outputs[0];
    for (let i = 0; i < output[0].length; i++) {
      this.dough.update();
      for (let c = 0; c < output.length; c++) {
        //prevent speaker blowout via clipping if threshold exceeds
        output[c][i] = clamp(this.dough.out[c], -1, 1);
      }
    }
    return true; // keep the audio processing going
  }
}

registerProcessor('dough-processor', DoughProcessor);
