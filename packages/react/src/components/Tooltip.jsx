import { createRoot } from 'react-dom/client';
import { hoverTooltip } from '@codemirror/view';
import jsdoc from '../../../../doc.json';
import { Autocomplete } from './Autocomplete';

const getDocLabel = (doc) => doc.name || doc.longname;

let ctrlDown = false;

// Record Control key event to trigger or block the tooltip depending on the state
window.addEventListener(
  'keyup',
  function (e) {
    if (e.key == 'Control') {
      ctrlDown = false;
    }
  },
  true,
);

window.addEventListener(
  'keydown',
  function (e) {
    if (e.key == 'Control') {
      ctrlDown = true;
    }
  },
  true,
);

export const strudelTooltip = hoverTooltip(
  (view, pos, side) => {
    // Word selection from CodeMirror Hover Tooltip example https://codemirror.net/examples/tooltip/#hover-tooltips
    if (!ctrlDown) {
      return null;
    }
    let { from, to, text } = view.state.doc.lineAt(pos);
    let start = pos,
      end = pos;
    while (start > from && /\w/.test(text[start - from - 1])) {
      start--;
    }
    while (end < to && /\w/.test(text[end - from])) {
      end++;
    }
    if ((start == pos && side < 0) || (end == pos && side > 0)) {
      return null;
    }
    let word = text.slice(start - from, end - from);
    // Get entry from Strudel documentation
    let entry = jsdoc.docs.filter((doc) => getDocLabel(doc) === word)[0];
    if (!entry) {
      // Try for synonyms
      entry = jsdoc.docs.filter((doc) => doc.synonyms && doc.synonyms.includes(word))[0];
      if (!entry) {
        return null;
      }
    }

    return {
      pos: start,
      end,
      above: false,
      arrow: true,
      create(view) {
        let dom = document.createElement('div');
        dom.className = 'strudel-tooltip';
        createRoot(dom).render(<Autocomplete doc={entry} label={word} />);
        return { dom };
      },
    };
  },
  { hoverTime: 10 },
);
