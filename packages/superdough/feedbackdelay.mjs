if (typeof DelayNode !== 'undefined') {
  class FeedbackDelayNode extends DelayNode {
    constructor(ac, wet, time, feedback) {
      super(ac);
      wet = Math.abs(wet);
      this.delayTime.value = time;

      const feedbackGain = ac.createGain();
      feedbackGain.gain.value = Math.min(Math.abs(feedback), 0.995);
      this.feedback = feedbackGain.gain;

      const delayGain = ac.createGain();
      delayGain.gain.value = wet;
      this.delayGain = delayGain;

      this.connect(feedbackGain);
      this.connect(delayGain);
      feedbackGain.connect(this);

      this.connect = (target) => delayGain.connect(target);
      return this;
    }
    start(t) {
      this.delayGain.gain.setValueAtTime(this.delayGain.gain.value, t + this.delayTime.value);
    }
  }

  AudioContext.prototype.createFeedbackDelay = function (wet, time, feedback) {
    return new FeedbackDelayNode(this, wet, time, feedback);
  };
}
