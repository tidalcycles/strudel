import { Pattern } from '@strudel/core';
import { registerWidget } from '@strudel/transpiler';
import { getWidgetDrawContext } from './Canvas.jsx';

registerWidget('roll', 'strudel-canvas');

Pattern.prototype.roll = function (id, options = { fold: 1 }) {
  // TODO: remove setTimeout...
  setTimeout(() => {
    const ctx = getWidgetDrawContext(id, options);
    this.pianoroll({ ...options, ctx });
  });
  return this;
};
