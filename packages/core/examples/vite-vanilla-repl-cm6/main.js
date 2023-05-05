// moved from sandbox: https://codesandbox.io/s/vanilla-codemirror-strudel-2wb7yw?file=/index.html:114-186

import { initEditor, highlightHaps, flash } from './codemirror';
import { initStrudel } from './strudel';
import { Drawer } from './drawer';
import { bumpStreet } from './tunes';
import { pianoroll, getDrawOptions } from '@strudel.cycles/core';

let code = bumpStreet;
const repl = initStrudel();
const roll = document.getElementById('roll');

const view = initEditor({
  initialCode: code,
  onChange: (v) => {
    code = v.state.doc.toString();
  },
  onEvaluate,
  onStop,
});

async function onEvaluate() {
  const { evaluate, scheduler } = await repl;
  flash(view);
  if (!scheduler.started) {
    scheduler.stop();
    await evaluate(code);
    drawer.start(scheduler);
  } else {
    await evaluate(code);
    drawer.invalidate(); // this is a bit mystic
  }
}

async function onStop() {
  const { scheduler } = await repl;
  scheduler.stop();
  drawer.stop();
}
const ctx = roll.getContext('2d');
let drawer = new Drawer(
  (haps, time, { drawTime }) => {
    const currentFrame = haps.filter((hap) => time >= hap.whole.begin && time <= hap.whole.end);
    highlightHaps(view, currentFrame);
    pianoroll({ ctx, time, haps, ...getDrawOptions(drawTime, { fold: 1 }) });
  },
  [-2, 2],
);

document.getElementById('play').addEventListener('click', () => onEvaluate());
document.getElementById('stop').addEventListener('click', async () => onStop());
