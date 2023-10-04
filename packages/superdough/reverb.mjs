import reverbGen from './reverbGen.mjs';

if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.generateReverb = reverbGen.generateReverb;

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
    convolver.generate = (d, fade, lp, dim, buf) => {
      if (buf) {
        convolver.buffer = this.adjustLength(d, buf);
        return convolver;
      } else {
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
        return convolver;
      }
    };
    convolver.setIR = (d, fade, lp, dim, buf) => {
      if (buf) {
        convolver.buffer = this.adjustLength(d, buf);
      } else {
        convolver.generate(d, fade, lp, dim, buf);
      }
      return convolver;
    };
    convolver.generate(duration, fade, lp, dim, ir);
    return convolver;
  };
}
