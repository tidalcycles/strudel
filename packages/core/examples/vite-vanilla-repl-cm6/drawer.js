const round = (x) => Math.round(x * 1000) / 1000;

export class Framer {
  constructor(onFrame, onError) {
    this.onFrame = onFrame;
    this.onError = onError;
  }
  start() {
    const self = this;
    let frame = requestAnimationFrame(function updateHighlights(time) {
      try {
        self.onFrame(time);
      } catch (err) {
        self.onError(err);
      }
      frame = requestAnimationFrame(updateHighlights);
    });
    self.cancel = () => {
      cancelAnimationFrame(frame);
    };
  }
  stop() {
    if (this.cancel) {
      this.cancel();
    }
  }
}

export class Drawer {
  constructor(onDraw, drawTime) {
    let [lookbehind, lookahead] = drawTime; // e.g. [-2, 2]
    lookbehind = Math.abs(lookbehind);
    this.visibleHaps = [];
    this.lastFrame = null;
    this.drawTime = drawTime;
    this.framer = new Framer(
      () => {
        if (!this.scheduler) {
          console.warn('Drawer: no scheduler');
          return;
        }
        // calculate current frame time (think right side of screen for pianoroll)
        const phase = this.scheduler.now() + lookahead;
        // first frame just captures the phase
        if (this.lastFrame === null) {
          this.lastFrame = phase;
          return;
        }
        // query haps from last frame till now. take last 100ms max
        const haps = this.scheduler.pattern.queryArc(Math.max(this.lastFrame, phase - 1 / 10), phase);
        this.lastFrame = phase;
        this.visibleHaps = (this.visibleHaps || [])
          // filter out haps that are too far in the past (think left edge of screen for pianoroll)
          .filter((h) => h.whole.end >= phase - lookbehind - lookahead)
          // add new haps with onset (think right edge bars scrolling in)
          .concat(haps.filter((h) => h.hasOnset()));
        const time = phase - lookahead;
        onDraw(this.visibleHaps, time, this);
      },
      (err) => {
        console.warn('draw error', err);
      },
    );
  }
  check() {
    if (!this.scheduler) {
      throw new Error('no scheduler set..');
    }
  }
  invalidate() {
    this.check();
    const t = this.scheduler.now();
    let [_, lookahead] = this.drawTime;
    // remove all future haps
    this.visibleHaps = this.visibleHaps.filter((h) => h.whole.begin < t);
    // query future haps
    const futureHaps = this.scheduler.pattern.queryArc(Math.max(t, 0), t + lookahead + 0.1); // +0.1 = workaround for weird holes in query..
    // append future haps
    this.visibleHaps = this.visibleHaps.concat(futureHaps);
  }
  start(scheduler) {
    this.scheduler = scheduler;
    this.invalidate();
    this.framer.start();
  }
  stop() {
    if (this.framer) {
      this.framer.stop();
    }
  }
}
