import ClockWorker from './clockworker.mjs';

class Scheduler {
  worker;
  pattern;
  constructor(audioContext, interval = 0.2) {
    this.worker = new ClockWorker(
      audioContext,
      (begin, end) => {
        this.pattern.query(new State(new TimeSpan(begin, end))).forEach((e) => {
          if (!e.part.begin.equals(e.whole.begin)) {
            return;
          }
          if (e.context.createAudioNode) {
            e.context.createAudioNode(e);
          } else {
            console.warn('unplayable event: no audio node');
          }
        });
      },
      interval,
    );
  }
  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    this.worker.start();
  }
  stop() {
    this.worker.stop();
  }
  setPattern(pat) {
    this.pattern = pat;
  }
}

export default Scheduler;
