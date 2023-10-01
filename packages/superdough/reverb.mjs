if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.impulseResponse = function (duration, channels = 1) {
    const length = this.sampleRate * duration;
    const impulse = this.createBuffer(channels, length, this.sampleRate);
    const IR = impulse.getChannelData(0);
    for (let i = 0; i < length; i++) IR[i] = (2 * Math.random() - 1) * Math.pow(1 - i / length, duration);
    return impulse;
  };

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

  AudioContext.prototype.createReverb = function (duration, buffer) {
    const convolver = this.createConvolver();
    convolver.setDuration = (dur, imp) => {
      convolver.buffer = imp ? this.adjustLength(dur, imp) : this.impulseResponse(dur);
      return convolver;
    };
    convolver.setIR = (dur, imp) => {
      convolver.buffer = imp ? this.adjustLength(dur, imp) : this.impulseResponse(dur);
      return convolver;
    };
    convolver.setDuration(duration, buffer);
    return convolver;
  };
}

// TODO: make the reverb more exciting
// check out https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
