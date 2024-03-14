import { For } from 'solid-js';
import { customElement } from 'solid-element';
import { getClaviature } from 'claviature';
import { Dynamic } from 'solid-js/web';

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
