import { draw, queryEvents, getDrawContext } from './draw.mjs';
import { Pattern } from '../../strudel.mjs';
import * as Tone from 'tone';

Pattern.prototype.pianoroll = function () {
  // draw stuff here with p.query
  const ctx = getDrawContext();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const s = 10; // 10s in viewport
  const maxMidi = 90;
  const height = h / maxMidi;
  let events;

  queryEvents(this, (_events) => (events = _events), s);

  const clear = () => ctx.clearRect(0, 0, w, h);

  const drawEvents = (events) => {
    events.forEach((event) => {
      const t = Tone.getTransport().seconds;
      const isActive = event.whole.begin <= t && event.whole.end >= t;
      ctx.fillStyle = isActive ? '#FFCA28' : '#88ABF8';
      const x = Math.round((event.whole.begin / s) * w);
      const width = Math.round(((event.whole.end - event.whole.begin) / s) * w);
      const y = Math.round(h - (Number(event.value) / maxMidi) * h);
      const offset = (t / s) * w;
      const margin = 0;
      // console.log(x, y, width, height)
      ctx.fillRect(x - offset + margin, y, width, height);
    });
  };

  draw((t) => {
    clear();
    ctx.fillStyle = '#2A3236';
    ctx.fillRect(0, 0, w, h);
    drawEvents(events);
  });
  return this;
};
