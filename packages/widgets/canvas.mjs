import { registerWidget, setWidget } from '@strudel/codemirror';

function getCanvasWidget(id, options) {
  const { width = 300, height = 100, pixelRatio = window.devicePixelRatio } = options || {};
  let canvas = document.getElementById(id) || document.createElement('canvas');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  setWidget(id, canvas);
  return canvas;
}

registerWidget('roll', (id, options = { fold: 1 }, pat) => {
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.pianoroll({ ...options, ctx, id });
});

registerWidget('twist', (id, options = {}, pat) => {
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.spiral({ ...options, ctx, size: 50, id });
});
