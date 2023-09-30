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
    const isSame = other.value.toFixed(4) == this.value.toFixed(4) && other.min == this.min && other.max == this.max;
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
    slider.className = 'w-16 translate-y-1.5';
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

let nodeValue = (node, view) => view.state.doc.sliceString(node.from, node.to);

// matches a number and returns slider widget
/* let matchNumber = (node, view) => {
  if (node.name == 'Number') {
    const value = view.state.doc.sliceString(node.from, node.to);
    let min = 0;
    let max = 10;
    return Decoration.widget({
      widget: new SliderWidget(Number(value), min, max, node.from, node.to),
      side: 0,
    });
  }
}; */

// matches something like slider(123) and returns slider widget
let matchSliderFunction = (node, view) => {
  if (node.name === 'CallExpression' /* && node.node.firstChild.name === 'ArgList' */) {
    let name = nodeValue(node.node.firstChild, view); // slider ?
    if (name === 'slider') {
      const args = node.node.lastChild.getChildren('Number');
      if (!args.length) {
        return;
      }
      const [value, min = 0, max = 1] = args.map((node) => nodeValue(node, view));
      //console.log('slider value', value, min, max);
      let { from, to } = args[0];
      let widget = Decoration.widget({
        widget: new SliderWidget(Number(value), min, max, from, to),
        side: 0,
      });
      //widget._range = widget.range(from);
      widget._range = widget.range(node.from);
      return widget;
    }
    // node is sth like 123.xxx
  }
};

// EditorView
export function sliders(view) {
  let widgets = [];
  for (let { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        let widget = matchSliderFunction(node, view);
        // let widget = matchNumber(node, view);
        if (widget) {
          widgets.push(widget._range || widget.range(node.from));
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
  let change = { from: draggedSlider.from, to: draggedSlider.to, insert };
  draggedSlider.to = draggedSlider.from + insert.length;
  view.dispatch({ changes: change });
  window.postMessage({ type: 'slider-change', value: next });
  return true;
}
