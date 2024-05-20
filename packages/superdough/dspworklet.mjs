import { getAudioContext } from './superdough.mjs';

let worklet;
export async function dspWorklet(ac, code) {
  const name = `dsp-worklet-${Date.now()}`;
  const workletCode = `${code}
let __q = []; // trigger queue
class MyProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.t = 0;
    this.stopped = false;
    this.port.onmessage = (e) => {
      if(e.data==='stop') {
        this.stopped = true;
      } else if(e.data?.dough) {
        __q.push(e.data)
      } else {
        msg?.(e.data)
      }
    };
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if(__q.length) {
      for(let i=0;i<__q.length;++i) {
        const deadline = __q[i].time-currentTime;
        if(deadline<=0) {
          trigger(__q[i].dough)
          __q.splice(i,1)
        }
      }
    }
    for (let i = 0; i < output[0].length; i++) {
      const out = dsp(this.t / sampleRate);
      output.forEach((channel) => {
        channel[i] = out;
      });
      this.t++;
    }
  return !this.stopped;
  }
}
registerProcessor('${name}', MyProcessor);
`;
  const base64String = btoa(workletCode);
  const dataURL = `data:text/javascript;base64,${base64String}`;
  await ac.audioWorklet.addModule(dataURL);
  const node = new AudioWorkletNode(ac, name);
  const stop = () => node.port.postMessage('stop');
  return { node, stop };
}
const stop = () => {
  if (worklet) {
    worklet?.stop();
    worklet?.node?.disconnect();
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    if (e.data === 'strudel-stop') {
      stop();
    } else if (e.data?.dough) {
      worklet?.node.port.postMessage(e.data);
    }
  });
}

export const dough = async (code) => {
  const ac = getAudioContext();
  stop();
  worklet = await dspWorklet(ac, code);
  worklet.node.connect(ac.destination);
};

export function doughTrigger(time_deprecate, hap, currentTime, cps, targetTime) {
  window.postMessage({ time: targetTime, dough: hap.value, currentTime, duration: hap.duration, cps });
}
