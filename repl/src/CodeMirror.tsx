import React from 'react';
import { Controlled as CodeMirror2 } from 'react-codemirror2';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/theme/material.css';
import 'codemirror/lib/codemirror.css';

export default function CodeMirror({ value, onChange, options }: any) {
  options = options || {
    mode: 'javascript',
    theme: 'material',
    lineNumbers: true,
  };
  return <CodeMirror2 value={value} options={options} onBeforeChange={onChange} />;
}
