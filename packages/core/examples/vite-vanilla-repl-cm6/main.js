// moved from sandbox: https://codesandbox.io/s/vanilla-codemirror-strudel-2wb7yw?file=/index.html:114-186

import { StrudelMirror } from '@strudel/codemirror';
import { initStrudel } from './strudel';
import { funk42 } from './tunes';
import { pianoroll, getDrawOptions, Drawer } from '@strudel.cycles/core';
import './style.css';

const repl = initStrudel();
const canvas = document.getElementById('roll');
canvas.width = canvas.width * 2;
canvas.height = canvas.height * 2;

const editor = new StrudelMirror({
  root: document.getElementById('editor'),
  initialCode: funk42,
  onEvaluate,
  onStop,
});

async function onEvaluate() {
  const { evaluate, scheduler } = await repl;
  editor.flash();
  if (!scheduler.started) {
    scheduler.stop();
    await evaluate(editor.code);
    drawer.start(scheduler);
  } else {
    await evaluate(editor.code);
    drawer.invalidate(); // this is a bit mystic
  }
}

async function onStop() {
  const { scheduler } = await repl;
  scheduler.stop();
  drawer.stop();
}

const ctx = canvas.getContext('2d');
let drawer = new Drawer(
  (haps, time, { drawTime }) => {
    const currentFrame = haps.filter((hap) => time >= hap.whole.begin && time <= hap.whole.end);
    editor.highlight(currentFrame);
    pianoroll({ ctx, time, haps, ...getDrawOptions(drawTime, { fold: 0 }) });
  },
  [-2, 2],
);

document.getElementById('play').addEventListener('click', () => onEvaluate());
document.getElementById('stop').addEventListener('click', async () => onStop());
