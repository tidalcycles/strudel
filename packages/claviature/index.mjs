export * from './Claviature.jsx';
import { Pattern } from '@strudel/core';
import { registerWidget } from '@strudel/transpiler';

registerWidget('claviature', 'strudel-claviature');

Pattern.prototype.claviature = function (id, options = {}) {
  return this.onFrame((haps) => {
    const keys = haps.map((h) => h.value.note);
    let el = document.getElementById(id);
    el?.setAttribute(
      'options',
      JSON.stringify({
        ...options,
        range: options.range || ['A2', 'C6'],
        colorize: [{ keys: keys, color: options.color || 'steelblue' }],
      }),
    );
  });
};
