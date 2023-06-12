import { EditorState } from '@codemirror/state';
import { EditorView, keymap, Decoration, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { StateField, StateEffect } from '@codemirror/state';
import { oneDark } from './themes/one-dark';
import { repl, Drawer } from '@strudel.cycles/core';

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
  constructor(options) {
    const { root, initialCode = '', onDraw, drawTime = [-2, 2], prebake, ...replOptions } = options;
    this.code = initialCode;

    this.drawer = new Drawer((haps, time) => {
      const currentFrame = haps.filter((hap) => time >= hap.whole.begin && time <= hap.endClipped);
      this.highlight(currentFrame);
      onDraw?.(haps, time, currentFrame);
    }, drawTime);

    const prebaked = prebake();
    prebaked.then(async () => {
      if (!onDraw) {
        return;
      }
      const { scheduler, evaluate } = await this.repl;
      // draw first frame instantly
      prebaked.then(async () => {
        await evaluate(this.code, false);
        this.drawer.invalidate(scheduler);
        onDraw?.(this.drawer.visibleHaps, 0, []);
      });
    });

    this.repl = repl({
      ...replOptions,
      onToggle: async (started) => {
        replOptions?.onToggle?.(started);
        const { scheduler } = await this.repl;
        if (started) {
          this.drawer.start(scheduler);
        } else {
          this.drawer.stop();
        }
      },
      beforeEval: async () => {
        await prebaked;
      },
      afterEval: (options) => {
        replOptions?.afterEval?.(options);
        this.drawer.invalidate();
      },
    });
    this.editor = initEditor({
      root,
      initialCode,
      onChange: (v) => {
        this.code = v.state.doc.toString();
      },
      onEvaluate: () => this.evaluate(),
      onStop: () => this.stop(),
    });
  }
  async evaluate() {
    const { evaluate } = await this.repl;
    this.flash();
    await evaluate(this.code);
  }
  async stop() {
    const { scheduler } = await this.repl;
    scheduler.stop();
  }
  flash(ms) {
    flash(this.editor, ms);
  }
  highlight(haps) {
    highlightHaps(this.editor, haps);
  }
}
