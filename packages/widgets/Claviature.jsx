import { For } from 'solid-js';
import { customElement } from 'solid-element';
import { getClaviature } from 'claviature';
import { Dynamic } from 'solid-js/web';
import { registerWidget } from '@strudel/codemirror';
import { getSolidWidget } from './solid.mjs';

customElement('strudel-claviature', { options: '{}' }, (props, { element }) => {
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
  options = { range: ['A0', 'C8'], scaleY: 1, scaleY: 0.5, scaleX: 0.5, ...options };
  const height = (options.upperHeight + options.lowerHeight) * options.scaleY;
  const el = getSolidWidget('strudel-claviature', id, { ...options, height });
  return pat.onFrame(id, (haps) => {
    const colorize = haps.map((h) => ({ keys: [h.value.note], color: h.context?.color || 'steelblue' }));
    el.setAttribute(
      'options',
      JSON.stringify({
        ...options,
        range: options.range || ['A2', 'C6'],
        colorize,
      }),
    );
  });
});
