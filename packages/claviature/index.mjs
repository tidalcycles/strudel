export * from './Claviature.jsx';
import { Pattern } from '@strudel/core';

Pattern.prototype.claviature = function (options = {}) {
  if (!window.claviature) {
    window.claviature = document.createElement('strudel-claviature');
    window.claviature.style.position = 'absolute';
    window.claviature.style.bottom = 0;
    window.claviature.style.left = 0;
    document.body.append(window.claviature);
  }
  return this.onFrame((haps) => {
    const keys = haps.map((h) => h.value.note);
    // console.log('keys',keys);
    window.claviature.setAttribute(
      'options',
      JSON.stringify({
        ...options,
        range: options.range || ['A2', 'C6'],
        colorize: [{ keys: keys, color: options.color || 'steelblue' }],
      }),
    );
  });
};
