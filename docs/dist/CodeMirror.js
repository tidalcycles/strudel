import React from "../_snowpack/pkg/react.js";
import {Controlled as CodeMirror2} from "../_snowpack/pkg/react-codemirror2.js";
import "../_snowpack/pkg/codemirror/mode/javascript/javascript.js";
import "../_snowpack/pkg/codemirror/mode/pegjs/pegjs.js";
import "../_snowpack/pkg/codemirror/lib/codemirror.css.proxy.js";
import "../_snowpack/pkg/codemirror/theme/material.css.proxy.js";
export default function CodeMirror({value, onChange, options, editorDidMount}) {
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
    editorDidMount
  });
}
export const markEvent = (editor) => (time, event) => {
  const locs = event.value.locations;
  if (!locs || !editor) {
    return;
  }
  const marks = locs.map(({start, end}) => editor.getDoc().markText({line: start.line - 1, ch: start.column}, {line: end.line - 1, ch: end.column}, {css: "background-color: #FFCA28; color: black"}));
  setTimeout(() => {
    marks.forEach((mark) => mark.clear());
  }, event.duration * 0.9 * 1e3);
};
