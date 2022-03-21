import { Pattern } from '../../strudel.mjs';

Pattern.prototype.pianoroll = function ({
  timeframe = 10,
  inactive = '#C9E597',
  active = '#FFCA28',
  background = '#2A3236',
  maxMidi = 90,
  minMidi = 0,
} = {}) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const midiRange = maxMidi - minMidi + 1;
  const height = h / midiRange;
  this.draw(
    (ctx, events, t) => {
      ctx.fillStyle = background;
      ctx.clearRect(0, 0, w, h);
      ctx.fillRect(0, 0, w, h);
      events.forEach((event) => {
        const isActive = event.whole.begin <= t && event.whole.end >= t;
        ctx.fillStyle = isActive ? active : inactive;
        const x = Math.round((event.whole.begin / timeframe) * w);
        const width = Math.round(((event.whole.end - event.whole.begin) / timeframe) * w);
        const y = Math.round(h - ((Number(event.value) - minMidi) / midiRange) * h);
        const offset = (t / timeframe) * w;
        const margin = 0;
        ctx.fillRect(x - offset + margin + 1, y + 1, width - 2, height - 2);
      });
    },
    timeframe,
    2 // lookaheadCycles
  );
  return this;
};
