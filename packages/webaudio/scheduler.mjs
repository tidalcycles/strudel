class Scheduler {
  metro;
  constructor(interval = 0.2, lookahead = 0.2) {
    this.metro = new Metro(
      audioContext,
      (begin, end, lookahead) => {
        pattern.query(new State(new TimeSpan(begin - lookahead, end - lookahead))).forEach((e) => {
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
      lookahead,
    );
  }
  start() {
    this.metro.start();
  }
  stop() {
    this.metro.stop();
  }
}
