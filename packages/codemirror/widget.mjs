import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { getWidgetID, registerWidgetType } from '@strudel/transpiler';
import { Pattern } from '@strudel/core';

export const addWidget = StateEffect.define({
  map: ({ from, to }, change) => {
    return { from: change.mapPos(from), to: change.mapPos(to) };
  },
});

export const updateWidgets = (view, widgets) => {
  view.dispatch({ effects: addWidget.of(widgets) });
};

function getWidgets(widgetConfigs) {
  return (
    widgetConfigs
      // codemirror throws an error if we don't sort
      .sort((a, b) => a.to - b.to)
      .map((widgetConfig) => {
        return Decoration.widget({
          widget: new BlockWidget(widgetConfig),
          side: 0,
          block: true,
        }).range(widgetConfig.to);
      })
  );
}

const widgetField = StateField.define(
  /* <DecorationSet> */ {
    create() {
      return Decoration.none;
    },
    update(widgets, tr) {
      widgets = widgets.map(tr.changes);
      for (let e of tr.effects) {
        if (e.is(addWidget)) {
          try {
            widgets = widgets.update({
              filter: () => false,
              add: getWidgets(e.value),
            });
          } catch (error) {
            console.log('err', error);
          }
        }
      }
      return widgets;
    },
    provide: (f) => EditorView.decorations.from(f),
  },
);

const widgetElements = {};
export function setWidget(id, el) {
  widgetElements[id] = el;
  el.id = id;
}

export class BlockWidget extends WidgetType {
  constructor(widgetConfig) {
    super();
    this.widgetConfig = widgetConfig;
  }
  eq() {
    return true;
  }
  toDOM() {
    const id = getWidgetID(this.widgetConfig);
    const el = widgetElements[id];
    return el;
  }
  ignoreEvent(e) {
    return true;
  }
}

export const widgetPlugin = [widgetField];

// widget implementer API to create a new widget type
export function registerWidget(type, fn) {
  registerWidgetType(type);
  if (fn) {
    Pattern.prototype[type] = function (id, options = { fold: 1 }) {
      // fn is expected to create a dom element and call setWidget(id, el);
      // fn should also return the pattern
      return fn(id, options, this);
    };
  }
}

// wire up @strudel/draw functions

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

registerWidget('_pianoroll', (id, options = {}, pat) => {
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.tag(id).pianoroll({ fold: 1, ...options, ctx, id });
});

registerWidget('_punchcard', (id, options = {}, pat) => {
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.tag(id).punchcard({ fold: 1, ...options, ctx, id });
});

registerWidget('_spiral', (id, options = {}, pat) => {
  let _size = options.size || 275;
  options = { width: _size, height: _size, ...options, size: _size / 5 };
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.tag(id).spiral({ ...options, ctx, id });
});

registerWidget('_scope', (id, options = {}, pat) => {
  options = { width: 500, height: 60, pos: 0.5, scale: 1, ...options };
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.tag(id).scope({ ...options, ctx, id });
});

registerWidget('_pitchwheel', (id, options = {}, pat) => {
  let _size = options.size || 200;
  options = { width: _size, height: _size, ...options, size: _size / 5 };
  const ctx = getCanvasWidget(id, options).getContext('2d');
  return pat.pitchwheel({ ...options, ctx, id });
});
