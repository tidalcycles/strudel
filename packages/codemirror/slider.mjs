import { WidgetType, ViewPlugin, Decoration } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';

export let sliderValues = {};
const getSliderID = (from) => `slider_${from}`;

export class SliderWidget extends WidgetType {
  constructor(value, min, max, from, to) {
    super();
    this.value = value;
    this.min = min;
    this.max = max;
    this.from = from;
    this.originalFrom = from;
    this.to = to;
  }

  eq() {
    return false;
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
    slider.originalValue = this.value;
    // to make sure the code stays in sync, let's save the original value
    // becuase .value automatically clamps values so it'll desync with the code
    slider.value = slider.originalValue;
    slider.from = this.from;
    slider.originalFrom = this.originalFrom;
    slider.to = this.to;
    slider.className = 'w-16 translate-y-1.5 mx-2';
    this.slider = slider;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

export const setWidgets = StateEffect.define();

export const updateWidgets = (view, widgets) => {
  view.dispatch({ effects: setWidgets.of(widgets) });
};

let draggedSlider;

function getWidgets(widgetConfigs) {
  return widgetConfigs.map(({ from, to, value, min, max }) => {
    return Decoration.widget({
      widget: new SliderWidget(value, min, max, from, to),
      side: 0,
    }).range(from /* , to */);
  });
}

export const sliderPlugin = ViewPlugin.fromClass(
  class {
    decorations; //: DecorationSet

    constructor(view /* : EditorView */) {
      this.decorations = Decoration.set([]);
    }

    update(update /* : ViewUpdate */) {
      update.transactions.forEach((tr) => {
        if (tr.docChanged) {
          this.decorations = this.decorations.map(tr.changes);
          const iterator = this.decorations.iter();
          while (iterator.value) {
            // when the widgets are moved, we need to tell the dom node the current position
            // this is important because the updateSliderValue function has to work with the dom node
            iterator.value.widget.slider.from = iterator.from;
            iterator.value.widget.slider.to = iterator.to;
            iterator.next();
          }
        }
        for (let e of tr.effects) {
          if (e.is(setWidgets)) {
            this.decorations = Decoration.set(getWidgets(e.value));
          }
        }
      });
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      mousedown: (e, view) => {
        let target = e.target; /* as HTMLElement */
        if (target.nodeName == 'INPUT' && target.parentElement.classList.contains('cm-slider')) {
          e.preventDefault();
          e.stopPropagation();
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

// moves slider on mouse event
function updateSliderValue(view, e) {
  const mouseX = e.clientX;
  let progress = (mouseX - draggedSlider._offsetLeft) / draggedSlider._clientWidth;
  progress = Math.max(Math.min(1, progress), 0);
  let min = Number(draggedSlider.min);
  let max = Number(draggedSlider.max);
  const next = Number(progress * (max - min) + min);
  let insert = next.toFixed(2);
  //let before = view.state.doc.sliceString(draggedSlider.from, draggedSlider.to).trim();
  let before = draggedSlider.originalValue;
  before = Number(before).toFixed(2);
  // console.log('before', before, 'insert', insert, 'v');
  if (before === insert) {
    return false;
  }
  const to = draggedSlider.from + draggedSlider.originalValue.length;
  let change = { from: draggedSlider.from, to, insert };
  draggedSlider.originalValue = insert;
  draggedSlider.value = insert;
  view.dispatch({ changes: change });
  const id = getSliderID(draggedSlider.originalFrom); // matches id generated in transpiler
  window.postMessage({ type: 'cm-slider', value: next, id });
  return true;
}

// user api
export let slider = (id, value, min, max) => {
  sliderValues[id] = value; // sync state at eval time (code -> state)
  return ref(() => sliderValues[id]); // use state at query time
};
// update state when sliders are moved
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    if (e.data.type === 'cm-slider') {
      if (sliderValues[e.data.id] !== undefined) {
        // update state when slider is moved
        sliderValues[e.data.id] = e.data.value;
      } else {
        console.warn(`slider with id "${e.data.id}" is not registered. Only ${Object.keys(sliderValues)}`);
      }
    }
  });
}
