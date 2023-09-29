import { WidgetType } from '@codemirror/view';
import { ViewPlugin, Decoration } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

export class CheckboxWidget extends WidgetType {
  constructor(checked) {
    super();
    this.checked = checked;
  }

  eq(other) {
    return other.checked == this.checked;
  }

  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = 'cm-boolean-toggle';
    let box = wrap.appendChild(document.createElement('input'));
    box.type = 'checkbox';
    box.checked = this.checked;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

// EditorView
export function checkboxes(view) {
  let widgets = [];
  for (let { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name == 'BooleanLiteral') {
          let isTrue = view.state.doc.sliceString(node.from, node.to) == 'true';
          let deco = Decoration.widget({
            widget: new CheckboxWidget(isTrue),
            side: 1,
          });
          widgets.push(deco.range(node.from));
        }
      },
    });
  }
  return Decoration.set(widgets);
}

export const checkboxPlugin = ViewPlugin.fromClass(
  class {
    decorations; //: DecorationSet

    constructor(view /* : EditorView */) {
      this.decorations = checkboxes(view);
    }

    update(update /* : ViewUpdate */) {
      if (update.docChanged || update.viewportChanged) this.decorations = checkboxes(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      mousedown: (e, view) => {
        let target = e.target; /* as HTMLElement */
        if (target.nodeName == 'INPUT' && target.parentElement.classList.contains('cm-boolean-toggle'))
          return toggleBoolean(view, view.posAtDOM(target));
      },
    },
  },
);

function toggleBoolean(view /* : EditorView */, pos /* : number */) {
  let before = view.state.doc.sliceString(Math.max(0, pos), pos + 5).trim();
  let change;
  if (!['true', 'false'].includes(before)) {
    return false;
  }
  let insert = before === 'true' ? 'false' : 'true';
  change = { from: pos, to: pos + before.length, insert };
  view.dispatch({ changes: change });
  return true;
}
