import { customElement } from 'solid-element';

customElement('strudel-canvas', {}, () => {
  return <canvas width={300} height={200} />;
});

export function getWidgetDrawContext(id, options) {
  let el = document.getElementById(id);
  if (!el) {
    console.warn(`widget with id ${id} not found in the DOM`);
    return;
  }
  const { width = 300, height = 100, pixelRatio = window.devicePixelRatio } = options || {};
  const canvas = el?.shadowRoot.firstChild;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  return ctx;
}
