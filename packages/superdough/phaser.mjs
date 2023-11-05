const createFilter = (ctx, cutoff, Q) => {
  const lowpassFilter = ctx.createBiquadFilter();
  lowpassFilter.type = 'notch';
  lowpassFilter.gain.value = 1;
  lowpassFilter.frequency.value = cutoff;
  lowpassFilter.Q.value = Q;
  return lowpassFilter;
};

const createOscillator = (ctx, freq) => {
  const osc = ctx.createOscillator();
  osc.frequency.value = freq;
  osc.type = 'sine';
  return osc;
};
const createGain = (ctx, gain) => {
  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;
  return gainNode;
};

const createLFO = (ctx, freq, gain) => {
  const osc = createOscillator(ctx, freq);
  const gainNode = createGain(ctx, gain);
  osc.start();
  osc.connect(gainNode);
  return gainNode;
};
if (typeof GainNode !== 'undefined') {
  class PhaserNode extends GainNode {
    constructor(ac, speed, cps) {
      super(ac);
      this.lfo;
      console.log(cps);

      const makeupGain = ac.createGain();

      if (this.lfo == null) {
        this.lfo = createLFO(ac, speed, 2000);
      }
      const numStages = 2;
      let fOffset = 0;
      for (let i = 0; i < numStages; i++) {
        const gain = ac.createGain();
        gain.gain.value = 1 / numStages;
        const filter = createFilter(ac, 1000 + fOffset, 0.5);
        this.connect(filter);
        this.lfo.connect(filter.detune);
        filter.connect(gain);
        gain.connect(makeupGain);
        fOffset += 200 + Math.pow(i, 2);
      }
      makeupGain.gain.value = 1; // how much makeup gain to add?
      this.connect = (target) => makeupGain.connect(target);
      return this;
    }
  }

  AudioContext.prototype.createPhaser = function (speed) {
    return new PhaserNode(this, speed);
  };
}
