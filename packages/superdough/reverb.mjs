import reverbGen from './reverbGen.mjs';

if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.generateReverb = reverbGen.generateReverb;
  AudioContext.prototype.createReverb = function(
    duration,
    audioContext,
    fade,
    revlp,
    revdim
  ) {
    const convolver = this.createConvolver();
    convolver.setDuration = (d) => {
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
        }
      );
      convolver.duration = d;
    };
    convolver.setDuration(duration);
    return convolver;
  };
}
