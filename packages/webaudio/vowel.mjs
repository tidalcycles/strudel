// credits to webdirt: https://github.com/dktr0/WebDirt/blob/41342e81d6ad694a2310d491fef7b7e8b0929efe/js-src/Graph.js#L597
export var vowelFormant = {
  a: { freqs: [660, 1120, 2750, 3000, 3350], gains: [1, 0.5012, 0.0708, 0.0631, 0.0126], qs: [80, 90, 120, 130, 140] },
  e: { freqs: [440, 1800, 2700, 3000, 3300], gains: [1, 0.1995, 0.1259, 0.1, 0.1], qs: [70, 80, 100, 120, 120] },
  i: { freqs: [270, 1850, 2900, 3350, 3590], gains: [1, 0.0631, 0.0631, 0.0158, 0.0158], qs: [40, 90, 100, 120, 120] },
  o: { freqs: [430, 820, 2700, 3000, 3300], gains: [1, 0.3162, 0.0501, 0.0794, 0.01995], qs: [40, 80, 100, 120, 120] },
  u: { freqs: [370, 630, 2750, 3000, 3400], gains: [1, 0.1, 0.0708, 0.0316, 0.01995], qs: [40, 60, 100, 120, 120] },
};
if (typeof GainNode !== 'undefined') {
  class VowelNode extends GainNode {
    constructor(ac, letter) {
      super(ac);
      if (!vowelFormant[letter]) {
        throw new Error('vowel: unknown vowel ' + letter);
      }
      const { gains, qs, freqs } = vowelFormant[letter];
      const makeupGain = ac.createGain();
      for (let i = 0; i < 5; i++) {
        const gain = ac.createGain();
        gain.gain.value = gains[i];
        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = qs[i];
        filter.frequency.value = freqs[i];
        this.connect(filter);
        filter.connect(gain);
        gain.connect(makeupGain);
      }
      makeupGain.gain.value = 8; // how much makeup gain to add?
      this.connect = (target) => makeupGain.connect(target);
      return this;
    }
  }

  AudioContext.prototype.createVowelFilter = function (letter) {
    return new VowelNode(this, letter);
  };
}
