import React from "../_snowpack/pkg/react.js";
import {Controlled as CodeMirror2} from "../_snowpack/pkg/react-codemirror2.js";
import "../_snowpack/pkg/codemirror/mode/javascript/javascript.js";
import "../_snowpack/pkg/codemirror/mode/pegjs/pegjs.js";
import "../_snowpack/pkg/codemirror/theme/material.css.proxy.js";
import "../_snowpack/pkg/codemirror/lib/codemirror.css.proxy.js";
export default function CodeMirror({value, onChange, options}) {
  options = options || {
    mode: "javascript",
    theme: "material",
    lineNumbers: true
  };
  return /* @__PURE__ */ React.createElement(CodeMirror2, {
    value,
    options,
    onBeforeChange: onChange
  });
}
