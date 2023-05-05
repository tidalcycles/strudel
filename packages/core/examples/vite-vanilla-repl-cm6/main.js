// moved from sandbox: https://codesandbox.io/s/vanilla-codemirror-strudel-2wb7yw?file=/index.html:114-186

import { StrudelMirror } from '@strudel/codemirror';
import { initStrudel } from './strudel';
import { Drawer } from './drawer';
import { funk42 } from './tunes';
import { pianoroll, getDrawOptions } from '@strudel.cycles/core';
import './style.css';

let code = funk42;
const repl = initStrudel();
const canvas = document.getElementById('roll');
canvas.width = canvas.width * 2;
canvas.height = canvas.height * 2;

const editor = new StrudelMirror({
  root: document.getElementById('editor'),
  initialCode: code,
  onChange: (v) => {
    code = v.state.doc.toString();
  },
  onEvaluate,
  onStop,
});

async function onEvaluate() {
  const { evaluate, scheduler } = await repl;
  editor.flash();
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
