import { For } from 'solid-js';
import { customElement } from 'solid-element';
import { getClaviature } from 'claviature';
import { Dynamic } from 'solid-js/web';
import { Pattern } from '@strudel/core';
import { registerWidget } from '@strudel/transpiler';

let defaultOptions = {
  range: ['A1', 'C6'],
};

customElement('strudel-claviature', { options: JSON.stringify(defaultOptions) }, (props, { element }) => {
  let svg = () => {
    let c = getClaviature({
      options: JSON.parse(props.options),
    });
    return c;
  };
  return (
    <div>
      <svg {...svg().attributes}>
        <For each={svg().children}>
          {(el) => {
            return (
              <Dynamic component={el.name} {...el.attributes}>
                {el.value}
              </Dynamic>
            );
          }}
        </For>
      </svg>
    </div>
  );
});

registerWidget('claviature', 'strudel-claviature');

Pattern.prototype.claviature = function (id, options = {}) {
  return this.onFrame((haps) => {
    const colorize = haps.map((h) => ({ keys: [h.value.note], color: h.context?.color || 'steelblue' }));
    let el = document.getElementById(id);
    el?.setAttribute(
      'options',
      JSON.stringify({
        ...options,
        range: options.range || ['A2', 'C6'],
        colorize,
      }),
    );
  });
};
