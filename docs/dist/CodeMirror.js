import React from "../_snowpack/pkg/react.js";
import {Controlled as CodeMirror2} from "../_snowpack/pkg/react-codemirror2.js";
import "../_snowpack/pkg/codemirror/mode/javascript/javascript.js";
import "../_snowpack/pkg/codemirror/mode/pegjs/pegjs.js";
import "../_snowpack/pkg/codemirror/lib/codemirror.css.proxy.js";
import "../_snowpack/pkg/codemirror/theme/material.css.proxy.js";
export default function CodeMirror({value, onChange, onCursor, options, editorDidMount}) {
  options = options || {
    mode: "javascript",
    theme: "material",
    lineNumbers: true,
    styleSelectedText: true,
    cursorBlinkRate: 500
  };
  return /* @__PURE__ */ React.createElement(CodeMirror2, {
    value,
    options,
    onBeforeChange: onChange,
    editorDidMount,
    onCursor: (editor, data) => onCursor?.(editor, data)
  });
}
export const markEvent = (editor) => (time, event) => {
  const locs = event.context.locations;
  if (!locs || !editor) {
    return;
  }
  const col = event.context?.color || "#FFCA28";
  const marks = locs.map(({start, end}) => editor.getDoc().markText({line: start.line - 1, ch: start.column}, {line: end.line - 1, ch: end.column}, {css: "outline: 1px solid " + col + "; box-sizing:border-box"}));
  setTimeout(() => {
    marks.forEach((mark) => mark.clear());
  }, event.duration * 1e3);
};
let parenMark;
export const markParens = (editor, data) => {
  const v = editor.getDoc().getValue();
  const marked = getCurrentParenArea(v, data);
  parenMark?.clear();
  parenMark = editor.getDoc().markText(...marked, {css: "background-color: #00007720"});
};
export function offsetToPosition(offset, code) {
  const lines = code.split("\n");
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
  return {line, ch};
}
export function positionToOffset(position, code) {
  const lines = code.split("\n");
  let offset = 0;
  for (let i = 0; i < position.line; i++) {
    offset += lines[i].length + 1;
  }
  offset += position.ch;
  return offset;
}
export function getCurrentParenArea(code, caretPosition) {
  const caret = positionToOffset(caretPosition, code);
  let open, i, begin, end;
  i = caret;
  open = 0;
  while (i > 0) {
    if (code[i - 1] === "(") {
      open--;
    } else if (code[i - 1] === ")") {
      open++;
    }
    if (open === -1) {
      break;
    }
    i--;
  }
  begin = i;
  i = caret;
  open = 0;
  while (i < code.length) {
    if (code[i] === "(") {
      open--;
    } else if (code[i] === ")") {
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
