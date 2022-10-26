if (typeof AudioContext !== 'undefined') {
  AudioContext.prototype.impulseResponse = function (duration) {
    const length = this.sampleRate * duration;
    const impulse = this.createBuffer(2, length, this.sampleRate);
    const IR = impulse.getChannelData(0);
    for (let i = 0; i < length; i++) IR[i] = (2 * Math.random() - 1) * Math.pow(1 - i / length, duration);
    return impulse;
  };

  AudioContext.prototype.createReverb = function (duration) {
    const convolver = this.createConvolver();
    convolver.setDuration = (d) => {
      convolver.buffer = this.impulseResponse(d);
      convolver.duration = duration;
      return convolver;
    };
    convolver.setDuration(duration);
    return convolver;
  };
}

// TODO: make the reverb more exciting
// check out https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
