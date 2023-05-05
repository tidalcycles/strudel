import { EditorState } from '@codemirror/state';
import { EditorView, keymap, Decoration, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { StateField, StateEffect } from '@codemirror/state';
import './style.css';

// https://codemirror.net/docs/guide/
export function initEditor({ initialCode, onChange, onEvaluate, onStop }) {
  let state = EditorState.create({
    doc: initialCode,
    extensions: [
      javascript(),
      lineNumbers(),
      /*gutter({
        class: "cm-mygutter"
      }),*/
      highlightField,
      highlightActiveLineGutter(),
      //markLineGutter,
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of(defaultKeymap),
      //flashField,
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
    parent: document.getElementById('editor'),
  });
}

// codemirror specific highlighting logic

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
