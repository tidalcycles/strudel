import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { Drawer, repl } from '@strudel.cycles/core';
import { flashField, flash } from './flash.mjs';
import { highlightExtension, highlightMiniLocations } from './highlight.mjs';
import { oneDark } from './themes/one-dark';

// https://codemirror.net/docs/guide/
export function initEditor({ initialCode = '', onChange, onEvaluate, onStop, theme = oneDark, root }) {
  let state = EditorState.create({
    doc: initialCode,
    extensions: [
      theme,
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
    const { root, initialCode = '', onDraw, drawTime = [-2, 2], prebake, ...replOptions } = options;
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
  highlight(haps, time) {
    highlightMiniLocations(this.editor.view, time, haps);
  }
}
