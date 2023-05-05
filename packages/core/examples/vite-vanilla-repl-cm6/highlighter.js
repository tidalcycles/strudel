const round = (x) => Math.round(x * 1000) / 1000;

// this class can be used to create a code highlighter
// it is encapsulated from the editor via the onUpdate callback
// the scheduler is expected to be an instance of Cyclist
export class Highlighter {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
  }
  start(scheduler) {
    let highlights = [];
    let lastEnd = 0;
    this.stop();
    const self = this;
    let frame = requestAnimationFrame(function updateHighlights() {
      try {
        const time = scheduler.now();
        // force min framerate of 10 fps => fixes crash on tab refocus, where lastEnd could be far away
        // see https://github.com/tidalcycles/strudel/issues/108
        const begin = Math.max(lastEnd ?? time, time - 1 / 10, -0.01); // negative time seems buggy
        const span = [round(begin), round(time + 1 / 60)];
        lastEnd = span[1];
        highlights = highlights.filter((hap) => hap.whole.end > time); // keep only highlights that are still active
        const haps = scheduler.pattern
          .queryArc(...span)
          .filter((hap) => hap.hasOnset());
        highlights = highlights.concat(haps); // add potential new onsets
        self.onUpdate(highlights); // highlight all still active + new active haps
      } catch (err) {
        self.onUpdate([]);
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
      this.onUpdate([]);
    }
  }
}
