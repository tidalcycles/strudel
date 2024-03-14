import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { Pattern } from '@strudel/core';

const getWidgetID = (from) => `ui_${from}`;

Pattern.prototype.ui = function (id, value) {
  // TODO: make this work with any web component
  return this.onFrame((haps) => {
    let el = document.getElementById(id);
    if (el) {
      let options = {};
      const keys = haps.map((h) => h.value.note);
      el.setAttribute(
        'options',
        JSON.stringify({
          ...options,
          range: options.range || ['A2', 'C6'],
          colorize: [{ keys: keys, color: options.color || 'steelblue' }],
        }),
      );
    }
  });
};

export const addWidget = StateEffect.define({
  map: ({ from, to }, change) => {
    return { from: change.mapPos(from), to: change.mapPos(to) };
  },
});

export const updateWidgets = (view, widgets) => {
  view.dispatch({ effects: addWidget.of(widgets) });
};

function getWidgets(widgetConfigs, view) {
  return widgetConfigs.map(({ from, to }) => {
    return Decoration.widget({
      widget: new BlockWidget(view, from),
      side: 0,
      block: true,
    }).range(to);
  });
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

export class BlockWidget extends WidgetType {
  constructor(view, from) {
    super();
    this.view = view;
    this.from = from;
  }
  eq() {
    return true;
  }
  toDOM() {
    const id = getWidgetID(this.from); // matches id generated in transpiler
    let el = document.getElementById(id);
    if (!el) {
      // TODO: make this work with any web component
      el = document.createElement('strudel-claviature');
      el.id = id;
    }
    return el;
  }
  ignoreEvent(e) {
    return true;
  }
}

export const widgetPlugin = [widgetField];
