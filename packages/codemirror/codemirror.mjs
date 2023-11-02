import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { Drawer, repl } from '@strudel.cycles/core';
import { flashField, flash } from './flash.mjs';
import { highlightExtension, highlightMiniLocations, updateMiniLocations } from './highlight.mjs';
import { oneDark } from './themes/one-dark';

const themeComparment = new Compartment();

// https://codemirror.net/docs/guide/
export function initEditor({ initialCode = '', onChange, onEvaluate, onStop, theme = oneDark, root }) {
  let state = EditorState.create({
    doc: initialCode,
    extensions: [
      themeComparment.of(theme),
      javascript(),
      lineNumbers(),
      highlightExtension,
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

export class StrudelMirror {
  constructor(options) {
    const { root, initialCode = '', onDraw, drawTime = [-2, 2], prebake, theme, ...replOptions } = options;
    this.code = initialCode;

    this.drawer = new Drawer((haps, time) => {
      const currentFrame = haps.filter((hap) => time >= hap.whole.begin && time <= hap.endClipped);
      this.highlight(currentFrame, time);
      onDraw?.(haps, time, currentFrame);
    }, drawTime);

    const prebaked = prebake();
    prebaked.then(async () => {
      if (!onDraw) {
        return;
      }
      // draw first frame instantly
      prebaked.then(async () => {
        await this.repl.evaluate(this.code, false);
        this.drawer.invalidate(this.repl.scheduler);
        onDraw?.(this.drawer.visibleHaps, 0, []);
      });
    });

    this.repl = repl({
      ...replOptions,
      onToggle: (started) => {
        replOptions?.onToggle?.(started);
        if (started) {
          this.drawer.start(this.repl.scheduler);
        } else {
          this.drawer.stop();
        }
      },
      beforeEval: async () => {
        await prebaked;
      },
      afterEval: (options) => {
        updateMiniLocations(this.editor, options.meta?.miniLocations);
        replOptions?.afterEval?.(options);
        this.drawer.invalidate();
      },
    });
    this.editor = initEditor({
      root,
      theme,
      initialCode,
      onChange: (v) => {
        if (v.docChanged) {
          this.code = v.state.doc.toString();
          this.repl.setCode(this.code);
        }
      },
      onEvaluate: () => this.evaluate(),
      onStop: () => this.stop(),
    });
  }
  async evaluate() {
    this.flash();
    await this.repl.evaluate(this.code);
  }
  async stop() {
    this.repl.scheduler.stop();
  }
  async toggle() {
    if (this.repl.scheduler.started) {
      this.repl.scheduler.stop();
    } else {
      this.evaluate();
    }
  }
  flash(ms) {
    flash(this.editor, ms);
  }
  highlight(haps, time) {
    highlightMiniLocations(this.editor, time, haps);
  }
  setTheme(theme) {
    this.editor.dispatch({
      effects: themeComparment.reconfigure(theme),
    });
  }
  setCode(code) {
    const changes = { from: 0, to: this.editor.state.doc.length, insert: code };
    this.editor.dispatch({ changes });
  }
}
