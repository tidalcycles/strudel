import { setWidget } from '@strudel/codemirror';

export function getSolidWidget(type, id, options) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    const c = document.createElement(type);
    el.appendChild(c);
  }
  el.height = options.height || 200;
  setWidget(id, el);
  return el?.firstChild;
}
