import React from 'react';
import { Controlled as CodeMirror2 } from 'react-codemirror2';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/pegjs/pegjs.js';
// import 'codemirror/theme/material.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

export default function CodeMirror({ value, onChange, options, editorDidMount }: any) {
  options = options || {
    mode: 'javascript',
    theme: 'material',
    lineNumbers: true,
    styleSelectedText: true,
    cursorBlinkRate: 500,
  };
  return <CodeMirror2 value={value} options={options} onBeforeChange={onChange} editorDidMount={editorDidMount} />;
}

export const markEvent = (editor) => (time, event) => {
  const locs = event.context.locations;
  if (!locs || !editor) {
    return;
  }
  // mark active event
  const marks = locs.map(({ start, end }) =>
    editor
      .getDoc()
      .markText(
        { line: start.line - 1, ch: start.column },
        { line: end.line - 1, ch: end.column },
        { css: 'background-color: #FFCA28; color: black' }
      )
  );
  //Tone.Transport.schedule(() => { // problem: this can be cleared by scheduler...
  setTimeout(() => {
    marks.forEach((mark) => mark.clear());
    // }, '+' + event.duration * 0.5);
  }, event.duration * 0.9 * 1000);
};

// idea: to improve highlighting, all patterns that appear anywhere in the code could be queried seperately
// the created events could then be used to highlight primitives as long as they are active
// this would create a less flickery output, with no duplications
// it would be seperated completely from the querying that happens to get the sound output
// it would also allow highlighting primitives that don't even end up in the sounding events (just for visual purposes)
