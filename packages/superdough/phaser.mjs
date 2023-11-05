// credits to webdirt: https://github.com/dktr0/WebDirt/blob/41342e81d6ad694a2310d491fef7b7e8b0929efe/js-src/Graph.js#L597
export var vowelFormant = {
  0: { freqs: [660, 1120, 2750, 3000, 3350], gains: [1, 0.5012, 0.0708, 0.0631, 0.0126], qs: [80, 90, 120, 130, 140] },
  1: { freqs: [440, 1800, 2700, 3000, 3300], gains: [1, 0.1995, 0.1259, 0.1, 0.1], qs: [70, 80, 100, 120, 120] },
  2: { freqs: [270, 1850, 2900, 3350, 3590], gains: [1, 0.0631, 0.0631, 0.0158, 0.0158], qs: [40, 90, 100, 120, 120] },
  3: { freqs: [430, 820, 2700, 3000, 3300], gains: [1, 0.3162, 0.0501, 0.0794, 0.01995], qs: [40, 80, 100, 120, 120] },
  4: { freqs: [370, 630, 2750, 3000, 3400], gains: [1, 0.1, 0.0708, 0.0316, 0.01995], qs: [40, 60, 100, 120, 120] },
};

var createFilter = function (ctx, cutoff, Q) {
  var lowpassFilter = ctx.createBiquadFilter();
  lowpassFilter.type = 'notch';
  lowpassFilter.gain.value = 1;
  lowpassFilter.frequency.value = cutoff;
  lowpassFilter.Q.value = Q;
  return lowpassFilter;
};

// var createTriOscillator = function (freq) {
//   var osc = ctx.createOscillator();
//   osc.type = 'triangle';
//   osc.frequency.value = freq * 1.0;
//   osc.detune.value = 0;
//   return osc;
// };

var createLFO = function (ctx, freq) {
  var osc = ctx.createOscillator();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.start();
  return osc;
};
var createLFOGain = function (ctx, gain) {
  var gainNode = ctx.createGain();
  gainNode.gain.value = gain;
  return gainNode;
};
let lfo, lfoGain;
if (typeof GainNode !== 'undefined') {
  class PhaserNode extends GainNode {
    constructor(ac, speed) {
      super(ac);
      console.log('speed', speed);

      if (!vowelFormant[speed]) {
        throw new Error('phaser: unknown phaser ' + speed);
      }
      const { gains, qs, freqs } = vowelFormant[speed];
      const makeupGain = ac.createGain();

      //   var sine = ac.createOscillator(),
      //     sineGain = ac.createGain();

      //   //set up our oscillator types
      //   sine.type = sine.SINE;

      //   //set the amplitude of the modulation
      //   sineGain.gain.value = 100;

      //   //connect the dots
      //   sine.connect(sineGain);
      if (lfo == null) {
        lfo = createLFO(ac, 0.25);
        lfoGain = createLFOGain(ac, 4000);

        lfo.connect(lfoGain);
      }
      //  sineGain.connect(saw.frequency);
      for (let i = 0; i < 6; i++) {
        const gain = ac.createGain();
        gain.gain.value = 0.5;
        const filter = createFilter(ac, 1000 + i * 20, 1);
        this.connect(filter);
        lfoGain.connect(filter.detune);
        filter.connect(gain);
        gain.connect(makeupGain);
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
