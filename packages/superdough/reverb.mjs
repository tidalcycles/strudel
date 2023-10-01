import reverbGen from './reverbGen.mjs';

if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.generateReverb = reverbGen.generateReverb;
  AudioContext.prototype.createReverb = function (audioContext, duration, fade, revlp, revdim) {
    const convolver = this.createConvolver();
    convolver.setDuration = (d, fade, revlp, revdim) => {
      this.generateReverb(
        {
          audioContext,
          sampleRate: 44100,
          numChannels: 2,
          decayTime: d,
          fadeInTime: fade,
          lpFreqStart: revlp,
          lpFreqEnd: revdim,
        },
        (buffer) => {
          convolver.buffer = buffer;
        },
      );
      convolver.duration = d;
      convolver.fade = fade;
      convolver.revlp = revlp;
      convolver.revdim = revdim;
    };
    convolver.setDuration(duration, fade, revlp, revdim);
    return convolver;
  };
}
