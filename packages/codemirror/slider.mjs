import { WidgetType } from '@codemirror/view';
import { ViewPlugin, Decoration } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

export class SliderWidget extends WidgetType {
  constructor(value, min, max, from, to) {
    super();
    this.value = value;
    this.min = min;
    this.max = max;
    this.from = from;
    this.to = to;
  }

  eq(other) {
    const isSame = other.value.toFixed(4) == this.value.toFixed(4);
    return isSame;
  }

  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = 'cm-slider'; // inline-flex items-center
    let slider = wrap.appendChild(document.createElement('input'));
    slider.type = 'range';
    slider.min = this.min;
    slider.max = this.max;
    slider.step = (this.max - this.min) / 1000;
    slider.value = this.value;
    slider.from = this.from;
    slider.to = this.to;
    slider.className = 'w-16';
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

// EditorView
export function sliders(view) {
  let widgets = [];
  for (let { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name == 'Number') {
          let value = view.state.doc.sliceString(node.from, node.to);
          value = Number(value);
          /* let min = Math.min(0, value);
          let max = Math.max(value, 1); */
          let min = 0;
          let max = 10;
          //console.log('from', node.from, 'to', node.to);
          let deco = Decoration.widget({
            widget: new SliderWidget(value, min, max, node.from, node.to),
            side: 1,
          });
          widgets.push(deco.range(node.from));
        }
      },
    });
  }
  return Decoration.set(widgets);
}

let draggedSlider, init;
export const sliderPlugin = ViewPlugin.fromClass(
  class {
    decorations; //: DecorationSet

    constructor(view /* : EditorView */) {
      this.decorations = sliders(view);
    }

    update(update /* : ViewUpdate */) {
      if (update.docChanged || update.viewportChanged) {
        !init && (this.decorations = sliders(update.view));
        //init = true;
      }
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      mousedown: (e, view) => {
        let target = e.target; /* as HTMLElement */
        if (target.nodeName == 'INPUT' && target.parentElement.classList.contains('cm-slider')) {
          draggedSlider = target;
          // remember offsetLeft / clientWidth, as they will vanish inside mousemove events for some reason
          draggedSlider._offsetLeft = draggedSlider.offsetLeft;
          draggedSlider._clientWidth = draggedSlider.clientWidth;
          return updateSliderValue(view, e);
        }
      },
      mouseup: () => {
        draggedSlider = undefined;
      },
      mousemove: (e, view) => {
        draggedSlider && updateSliderValue(view, e);
      },
    },
  },
);

function updateSliderValue(view, e) {
  const mouseX = e.clientX;
  let progress = (mouseX - draggedSlider._offsetLeft) / draggedSlider._clientWidth;
  progress = Math.max(Math.min(1, progress), 0);
  let min = Number(draggedSlider.min);
  let max = Number(draggedSlider.max);
  const next = Number(progress * (max - min) + min);
  let insert = next.toFixed(2);
  let before = view.state.doc.sliceString(draggedSlider.from, draggedSlider.to).trim();
  before = Number(before).toFixed(4);
  if (before === next) {
    return false;
  }
  //console.log('before', before, '->', insert);
  let change = { from: draggedSlider.from, to: draggedSlider.to, insert };
  draggedSlider.to = draggedSlider.from + insert.length;
  //console.log('change', change);
  view.dispatch({ changes: change });

  return true;
}
