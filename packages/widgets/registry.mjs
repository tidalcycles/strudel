import { registerWidgetType } from '@strudel/transpiler';
import { Pattern } from '@strudel/core';

export function registerWidget(type, fn) {
  registerWidgetType(type);
  if (fn) {
    Pattern.prototype[type] = function (id, options = { fold: 1 }) {
      return fn(id, options, this);
    };
  }
}
