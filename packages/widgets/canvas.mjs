import { registerWidget, setWidget } from '@strudel/codemirror';

function getCanvasWidget(id, options = {}) {
  const { width = 500, height = 60, pixelRatio = window.devicePixelRatio } = options;
  let canvas = document.getElementById(id) || document.createElement('canvas');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  setWidget(id, canvas);
  return canvas;
}

registerWidget('roll', (id, options = {}, pat) => {
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.pianoroll({ fold: 1, ...options, ctx, id });
});

registerWidget('twist', (id, options = {}, pat) => {
  options = { width: 200, height: 200, size: 36, ...options };
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.spiral({ ...options, ctx, id });
});

registerWidget('osci', (id, options = {}, pat) => {
  options = { width: 500, height: 60, pos: 0.5, scale: 1, ...options };
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.scope({ ...options, ctx, id });
});
