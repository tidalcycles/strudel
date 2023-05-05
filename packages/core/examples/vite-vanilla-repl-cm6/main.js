// moved from sandbox: https://codesandbox.io/s/vanilla-codemirror-strudel-2wb7yw?file=/index.html:114-186

import { initEditor, highlightHaps } from './codemirror';
import { initStrudel } from './strudel';
import { Highlighter } from './highlighter';
import { bumpStreet } from './tunes';
let code = bumpStreet;

const view = initEditor(code, (v) => {
  code = v.state.doc.toString();
});
const repl = initStrudel();

let highlighter = new Highlighter((haps) => highlightHaps(view, haps));

document.getElementById('play').addEventListener('click', async () => {
  const { evaluate, scheduler } = await repl;
  if (!scheduler.started) {
    scheduler.stop();
    scheduler.lastEnd = 0;
    await evaluate(code);
    highlighter.start(scheduler);
  } else {
    await evaluate(code);
  }
});

document.getElementById('stop').addEventListener('click', async () => {
  const { stop } = await repl;
  stop();
  highlighter.stop();
});
