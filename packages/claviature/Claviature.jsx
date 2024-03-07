import { createSignal, For } from 'solid-js';
import { customElement } from 'solid-element';
import { getClaviature } from 'claviature';
import { Dynamic } from 'solid-js/web';

customElement('strudel-claviature', { someProp: 'one', otherProp: 'two' }, (props, { element }) => {
  const svg = getClaviature({
    options: {
      range: ['A1', 'C4'],
      colorize: [{ keys: ['C3', 'E3', 'G3'], color: 'yellow' }],
    },
  });
  const [activeNotes, setActiveNotes] = createSignal([]);
  return (
    <div>
      <svg {...svg.attributes}>
        <For each={svg.children}>
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
