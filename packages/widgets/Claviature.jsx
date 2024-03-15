import { For } from 'solid-js';
import { customElement } from 'solid-element';
import { getClaviature } from 'claviature';
import { Dynamic } from 'solid-js/web';
import { registerWidget } from './registry.mjs';

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
  );
});

registerWidget('claviature', (id, options = {}, pat) => {
  const el = document.getElementById(id) || document.createElement('strudel-claviature');
  setWidget(id, el);
  return pat.onFrame(id, (haps) => {
    const colorize = haps.map((h) => ({ keys: [h.value.note], color: h.context?.color || 'steelblue' }));
    el?.setAttribute(
      'options',
      JSON.stringify({
        ...options,
        range: options.range || ['A2', 'C6'],
        colorize,
      }),
    );
  });
});
