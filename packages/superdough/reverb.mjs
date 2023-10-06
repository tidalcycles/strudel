import reverbGen from './reverbGen.mjs';

if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.generateReverb = reverbGen.generateReverb;
  AudioContext.prototype.createReverb = function (duration, fade, lp, dim) {
    const convolver = this.createConvolver();
    convolver.generate = (d = 2, fade = 0.1, lp = 15000, dim = 1000) => {
      this.generateReverb(
        {
          audioContext: this,
          sampleRate: 44100,
          numChannels: 2,
          decayTime: d,
          fadeInTime: fade,
          lpFreqStart: lp,
          lpFreqEnd: dim,
        },
        (buffer) => {
          convolver.buffer = buffer;
        },
      );
      convolver.duration = d;
      convolver.fade = fade;
      convolver.lp = lp;
      convolver.dim = dim;
    };
    convolver.generate(duration, fade, lp, dim);
    return convolver;
  };
}
