import React from 'react';
import { CodeMirror as _CodeMirror } from 'react-codemirror6';
import { EditorView, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { materialPalenight } from 'codemirror6-themes';

// EditorView.theme(materialPalenight);

const highlightMark = Decoration.mark({ class: 'cm-highlight' });
const addHighlight = StateEffect.define();
const removeHighlight = StateEffect.define();
const highlightTheme = EditorView.baseTheme({
  '.cm-highlight': { outline: '1px solid #FFCA28' },
  // '.cm-highlight': { background: '#FFCA28' },
});
const highlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    highlights = highlights.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addHighlight)) {
        highlights = highlights.update({
          add: [highlightMark.range(e.value.from, e.value.to)],
        });
      }
      if (e.is(removeHighlight)) {
        highlights = highlights.update({
          filter: (f, t, value) => {
            if (f === e.value.from && t === e.value.to) {
              return false;
            }
            return true;
            // console.log('filter', f,t,value, e.value.from, e.value.to);
          },
        });
      }
    }
    return highlights;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// let timeouts = [];

export const highlightEvent = (event, view, code) => {
  if (!view) {
    return;
  }
  const ranges = event.context?.locations?.map(({ start, end }) => {
    return [start, end].map(({ line, column }) => positionToOffset({ line: line - 1, ch: column }, code));
  });
  const effects = ranges.map(([from, to]) => addHighlight.of({ from, to }));

  if (!effects.length) return false;
  if (!view.state.field(highlightField, false)) {
    effects.push(StateEffect.appendConfig.of([highlightField, highlightTheme]));
  }
  view.dispatch({ effects });
  // const index = timeouts.length;
  // timeouts = timeouts.filter(time)
  /* const timeout =  */ setTimeout(() => {
    const effects = ranges.map(([from, to]) => removeHighlight.of({ from, to }));
    view.dispatch({ effects });
    // timeouts.splice(index, 1);
  }, event.duration * 1000);
  // timeouts.pusn({timeout,);
};

export default function CodeMirror({ value, onChange, onViewChanged, onCursor, options, editorDidMount }) {
  return (
    <>
      <_CodeMirror
        onViewChange={onViewChanged}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 0 auto',
        }}
        value={value}
        onChange={onChange}
        extensions={[
          javascript(),
          materialPalenight
          // theme, language, ...
        ]}
      />
    </>
  );
}

let parenMark;
export const markParens = (editor, data) => {
  const v = editor.getDoc().getValue();
  const marked = getCurrentParenArea(v, data);
  parenMark?.clear();
  parenMark = editor.getDoc().markText(...marked, { css: 'background-color: #00007720' }); //
};

// returns { line, ch } from absolute character offset
export function offsetToPosition(offset, code) {
  const lines = code.split('\n');
  let line = 0;
  let ch = 0;
  for (let i = 0; i < offset; i++) {
    if (ch === lines[line].length) {
      line++;
      ch = 0;
    } else {
      ch++;
    }
  }
  return { line, ch };
}

// returns absolute character offset from { line, ch }
export function positionToOffset(position, code) {
  const lines = code.split('\n');
  let offset = 0;
  for (let i = 0; i < position.line; i++) {
    offset += lines[i].length + 1;
  }
  offset += position.ch;
  return offset;
}

// given code and caret position, the functions returns the indices of the parens we are in
export function getCurrentParenArea(code, caretPosition) {
  const caret = positionToOffset(caretPosition, code);
  let open, i, begin, end;
  // walk left
  i = caret;
  open = 0;
  while (i > 0) {
    if (code[i - 1] === '(') {
      open--;
    } else if (code[i - 1] === ')') {
      open++;
    }
    if (open === -1) {
      break;
    }
    i--;
  }
  begin = i;
  // walk right
  i = caret;
  open = 0;
  while (i < code.length) {
    if (code[i] === '(') {
      open--;
    } else if (code[i] === ')') {
      open++;
    }
    if (open === 1) {
      break;
    }
    i++;
  }
  end = i;
  return [begin, end].map((o) => offsetToPosition(o, code));
}

/* 
export const markEvent = (editor) => (time, event) => {
  const locs = event.context.locations;
  if (!locs || !editor) {
    return;
  }
  const col = event.context?.color || '#FFCA28';
  // mark active event
  const marks = locs.map(({ start, end }) =>
    editor.getDoc().markText(
      { line: start.line - 1, ch: start.column },
      { line: end.line - 1, ch: end.column },
      //{ css: 'background-color: #FFCA28; color: black' } // background-color is now used by parent marking
      { css: 'outline: 1px solid ' + col + '; box-sizing:border-box' },
      //{ css: `background-color: ${col};border-radius:5px` },
    ),
  );
  //Tone.Transport.schedule(() => { // problem: this can be cleared by scheduler...
  setTimeout(() => {
    marks.forEach((mark) => mark.clear());
    // }, '+' + event.duration * 0.5);
  }, event.duration * 1000);
}; */
