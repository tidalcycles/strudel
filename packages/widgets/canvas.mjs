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
  // TODO: find way to clear previous analysers to avoid memory leak
  // .scope passes id to Pattern.analyze, which is picked up by superdough
  // .. which calls getAnalyserById(analyze), creating a new analyzer (+buffer) for that key
  // the id here is the col number where the osci function ends (as passed by the transpiler)
  // effectively, this means for each evaluation of .osci on a unique col, a new analyser will be created
  // the problem is that the old ones will never get deleted.. this might pile up some memory
  return pat.scope({ ...options, ctx, id });
});
