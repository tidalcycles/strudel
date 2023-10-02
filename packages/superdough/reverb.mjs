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

  AudioContext.prototype.createReverb = function (audioContext, duration, fade, revlp, revdim, imp) {
    const convolver = this.createConvolver();

    convolver.setDuration = (d, fade, revlp, revdim, imp) => {
      if (imp) {
        convolver.buffer = this.adjustLength(d, imp);
        return convolver;
      } else {
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
        convolver.duration = duration;
        convolver.fade = fade;
        convolver.revlp = revlp;
        convolver.revdim = revdim;
        return convolver;
      }
    };
    convolver.setIR = (d, fade, revlp, revdim, imp) => {
      if (imp) {
        convolver.buffer = this.adjustLength(d, imp);
      } else {
        convolver.setDuration(d, fade, revlp, revdim, imp);
      }
      return convolver;
    };
    convolver.setDuration(duration, fade, revlp, revdim, imp);
    return convolver;
  };
}

// TODO: make the reverb more exciting
// check out https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
