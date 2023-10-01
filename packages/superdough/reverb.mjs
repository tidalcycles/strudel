if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.impulseResponse = function (duration, channels = 1) {
    const length = this.sampleRate * duration;
    const impulse = this.createBuffer(channels, length, this.sampleRate);
    const IR = impulse.getChannelData(0);
    for (let i = 0; i < length; i++) IR[i] = (2 * Math.random() - 1) * Math.pow(1 - i / length, duration);
    return impulse;
  };

  AudioContext.prototype.createReverb = function (duration, buffer) {
    const convolver = this.createConvolver();
    convolver.setDuration = (d, i) => {
      convolver.buffer = i !== undefined ? buffer : this.impulseResponse(d);
      convolver.duration = d;
      return convolver;
    };
    convolver.setIR = (i) => {
      convolver.buffer = i;
      return convolver;
    };
    if (buffer !== undefined) {
      convolver.setIR(buffer);
    } else {
      convolver.setDuration(duration);
    }
    return convolver;
  };
}

// TODO: make the reverb more exciting
// check out https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
