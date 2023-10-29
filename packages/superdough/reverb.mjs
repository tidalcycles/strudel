import reverbGen from './reverbGen.mjs';

if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.adjustLength = function (duration, buffer) {
    const newLength = buffer.sampleRate * duration;
    const newBuffer = this.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      let oldData = buffer.getChannelData(channel);
      let newData = newBuffer.getChannelData(channel);

      for (let i = 0; i < newLength; i++) {
        newData[i] = oldData[i] || 0;
      }
    }
    return newBuffer;
  };

  AudioContext.prototype.createReverb = function (duration, fade, lp, dim, ir) {
    const convolver = this.createConvolver();
    convolver.generate = (d = 2, fade = 0.1, lp = 15000, dim = 1000, ir) => {
      convolver.duration = d;
      convolver.fade = fade;
      convolver.lp = lp;
      convolver.dim = dim;
      convolver.ir = ir;
      if (ir) {
        convolver.buffer = this.adjustLength(d, ir);
      } else {
        reverbGen.generateReverb(
          {
            audioContext: this,
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
      }
    };
    convolver.generate(duration, fade, lp, dim, ir);
    return convolver;
  };
}
