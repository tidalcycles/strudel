// moved from sandbox: https://codesandbox.io/s/vanilla-codemirror-strudel-2wb7yw?file=/index.html:114-186

import { initEditor, highlightHaps, flash } from './codemirror';
import { initStrudel } from './strudel';
import { Highlighter } from './highlighter';
import { bumpStreet } from './tunes';
let code = bumpStreet;
const repl = initStrudel();

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
    highlighter.start(scheduler);
  } else {
    await evaluate(code);
  }
}

async function onStop() {
  const { scheduler } = await repl;
  scheduler.stop();
  highlighter.stop();
}

let highlighter = new Highlighter((haps) => highlightHaps(view, haps));

document.getElementById('play').addEventListener('click', () => onEvaluate());

document.getElementById('stop').addEventListener('click', async () => onStop());
