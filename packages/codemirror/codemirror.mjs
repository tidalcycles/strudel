import { EditorState } from '@codemirror/state';
import { EditorView, keymap, Decoration, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { StateField, StateEffect } from '@codemirror/state';
import { oneDark } from './themes/one-dark';

// https://codemirror.net/docs/guide/
export function initEditor({ initialCode = '', onChange, onEvaluate, onStop, theme = oneDark, root }) {
  let state = EditorState.create({
    doc: initialCode,
    extensions: [
      theme,
      javascript(),
      lineNumbers(),
      highlightField,
      highlightActiveLineGutter(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of(defaultKeymap),
      flashField,
      EditorView.updateListener.of((v) => onChange(v)),
      keymap.of([
        {
          key: 'Ctrl-Enter',
          run: () => onEvaluate(),
        },
        {
          key: 'Ctrl-.',
          run: () => onStop(),
        },
      ]),
    ],
  });

  return new EditorView({
    state,
    parent: root,
  });
}

//
//  highlighting
//

export const setHighlights = StateEffect.define();
export const highlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setHighlights)) {
          const { haps } = e.value;
          const marks =
            haps
              .map((hap) =>
                (hap.context.locations || []).map(({ start, end }) => {
                  // const color = hap.context.color || e.value.color || '#FFCA28';
                  let from = tr.newDoc.line(start.line).from + start.column;
                  let to = tr.newDoc.line(end.line).from + end.column;
                  const l = tr.newDoc.length;
                  if (from > l || to > l) {
                    return; // dont mark outside of range, as it will throw an error
                  }
                  const mark = Decoration.mark({
                    attributes: { style: `outline: 2px solid #FFCA28;` },
                  });
                  return mark.range(from, to);
                }),
              )
              .flat()
              .filter(Boolean) || [];
          highlights = Decoration.set(marks, true);
        }
      }
      return highlights;
    } catch (err) {
      // console.warn('highlighting error', err);
      return Decoration.set([]);
    }
  },
  provide: (f) => EditorView.decorations.from(f),
});

// helper to simply trigger highlighting for given haps
export function highlightHaps(view, haps) {
  view.dispatch({ effects: setHighlights.of({ haps }) });
}

//
// flash
//

export const setFlash = StateEffect.define();
const flashField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(flash, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setFlash)) {
          if (e.value) {
            const mark = Decoration.mark({ attributes: { style: `background-color: #FFCA2880` } });
            flash = Decoration.set([mark.range(0, tr.newDoc.length)]);
          } else {
            flash = Decoration.set([]);
          }
        }
      }
      return flash;
    } catch (err) {
      console.warn('flash error', err);
      return flash;
    }
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const flash = (view, ms = 200) => {
  view.dispatch({ effects: setFlash.of(true) });
  setTimeout(() => {
    view.dispatch({ effects: setFlash.of(false) });
  }, ms);
};

export class StrudelMirror {
  constructor({ root, initialCode = '', onEvaluate, onStop }) {
    this.code = initialCode;
    this.view = initEditor({
      root,
      initialCode,
      onChange: (v) => {
        this.code = v.state.doc.toString();
      },
      onEvaluate,
      onStop,
    });
  }
  flash(ms) {
    flash(this.view, ms);
  }
  highlight(haps) {
    highlightHaps(this.view, haps);
  }
}
