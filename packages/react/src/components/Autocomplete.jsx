import { createRoot } from 'react-dom/client';
import jsdoc from '../../../../doc.json';

const getDocLabel = (doc) => doc.name || doc.longname;
const getInnerText = (html) => {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export function Autocomplete({ doc, label }) {
  return (
    <div className="prose dark:prose-invert  max-h-[400px] overflow-auto">
      <h3 className="pt-0 mt-0">{label || getDocLabel(doc)}</h3>
      <div dangerouslySetInnerHTML={{ __html: doc.description }} />
      <ul>
        {doc.params?.map(({ name, type, description }, i) => (
          <li key={i}>
            {name} : {type.names?.join(' | ')} {description ? <> - {getInnerText(description)}</> : ''}
          </li>
        ))}
      </ul>
      <div>
        {doc.examples?.map((example, i) => (
          <div key={i}>
            <pre
              className="cursor-pointer"
              onMouseDown={(e) => {
                navigator.clipboard.writeText(example);
                e.stopPropagation();
              }}
            >
              {example}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

const jsdocCompletions = jsdoc.docs
  .filter(
    (doc) =>
      getDocLabel(doc) &&
      !getDocLabel(doc).startsWith('_') &&
      !['package'].includes(doc.kind) &&
      !['superdirtOnly', 'noAutocomplete'].some((tag) => doc.tags?.find((t) => t.originalTitle === tag)),
  )
  // https://codemirror.net/docs/ref/#autocomplete.Completion
  .map((doc) /*: Completion */ => ({
    label: getDocLabel(doc),
    // detail: 'xxx', // An optional short piece of information to show (with a different style) after the label.
    info: () => {
      const node = document.createElement('div');
      // if Autocomplete is non-interactive, it could also be rendered at build time..
      // .. using renderToStaticMarkup
      createRoot(node).render(<Autocomplete doc={doc} />);
      return node;
    },
    type: 'function', // https://codemirror.net/docs/ref/#autocomplete.Completion.type
  }));

export const strudelAutocomplete = (context /* : CompletionContext */) => {
  let word = context.matchBefore(/\w*/);
  if (word.from == word.to && !context.explicit) return null;
  return {
    from: word.from,
    options: jsdocCompletions,
    /*     options: [
      { label: 'match', type: 'keyword' },
      { label: 'hello', type: 'variable', info: '(World)' },
      { label: 'magic', type: 'text', apply: '⠁⭒*.✩.*⭒⠁', detail: 'macro' },
    ], */
  };
};
