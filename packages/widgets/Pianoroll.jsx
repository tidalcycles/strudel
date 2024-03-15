import { Pattern } from '@strudel/core';
import { registerWidget } from '@strudel/transpiler';
import { customElement } from 'solid-element';

customElement('strudel-pianoroll', { options: JSON.stringify('{}') }, (props, { element }) => {
  return <canvas width={400} height={100} />;
});

registerWidget('roll', 'strudel-pianoroll');

Pattern.prototype.roll = function (id, options = { fold: 1 }) {
  // TODO: remove setTimeout...
  setTimeout(() => {
    let el = document.getElementById(id);
    if (!el) {
      console.log('widget not found...');
      return this;
    }
    const { width = 400, height = 100 } = options;
    const canvas = el?.shadowRoot.firstChild;
    const pixelRatio = window.devicePixelRatio;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    this.pianoroll({ ...options, ctx });
  });
  return this;
};
