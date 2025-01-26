import { closeBrackets } from '@codemirror/autocomplete';
export { toggleComment, toggleBlockComment, toggleLineComment, toggleBlockCommentByLine } from '@codemirror/commands';
// import { search, highlightSelectionMatches } from '@codemirror/search';
import { history } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { defaultHighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLineGutter,
  highlightActiveLine,
  keymap,
  lineNumbers,
  drawSelection,
} from '@codemirror/view';
import { repl, registerControl } from '@strudel/core';
import { Drawer, cleanupDraw } from '@strudel/draw';
import { isAutoCompletionEnabled } from './autocomplete.mjs';
import { isTooltipEnabled } from './tooltip.mjs';
import { flash, isFlashEnabled } from './flash.mjs';
import { highlightMiniLocations, isPatternHighlightingEnabled, updateMiniLocations } from './highlight.mjs';
import { keybindings } from './keybindings.mjs';
import { initTheme, activateTheme, theme } from './themes.mjs';
import { sliderPlugin, updateSliderWidgets } from './slider.mjs';
import { widgetPlugin, updateWidgets } from './widget.mjs';
import { persistentAtom } from '@nanostores/persistent';

const extensions = {
  isLineWrappingEnabled: (on) => (on ? EditorView.lineWrapping : []),
  isBracketMatchingEnabled: (on) => (on ? bracketMatching({ brackets: '()[]{}<>' }) : []),
  isBracketClosingEnabled: (on) => (on ? closeBrackets() : []),
  isLineNumbersDisplayed: (on) => (on ? lineNumbers() : []),
  theme,
  isAutoCompletionEnabled,
  isTooltipEnabled,
  isPatternHighlightingEnabled,
  isActiveLineHighlighted: (on) => (on ? [highlightActiveLine(), highlightActiveLineGutter()] : []),
  isFlashEnabled,
  keybindings,
};
const compartments = Object.fromEntries(Object.keys(extensions).map((key) => [key, new Compartment()]));

export const defaultSettings = {
  keybindings: 'codemirror',
  isBracketMatchingEnabled: false,
  isBracketClosingEnabled: true,
  isLineNumbersDisplayed: true,
  isActiveLineHighlighted: false,
  isAutoCompletionEnabled: false,
  isPatternHighlightingEnabled: true,
  isFlashEnabled: true,
  isTooltipEnabled: false,
  isLineWrappingEnabled: false,
  theme: 'strudelTheme',
  fontFamily: 'monospace',
  fontSize: 18,
};

export const codemirrorSettings = persistentAtom('codemirror-settings', defaultSettings, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// https://codemirror.net/docs/guide/
export function initEditor({ initialCode = '', onChange, onEvaluate, onStop, root }) {
  const settings = codemirrorSettings.get();
  const initialSettings = Object.keys(compartments).map((key) =>
    compartments[key].of(extensions[key](parseBooleans(settings[key]))),
  );
  initTheme(settings.theme);
  let state = EditorState.create({
    doc: initialCode,
    extensions: [
      /* search(),
      highlightSelectionMatches(), */
      ...initialSettings,
      javascript(),
      sliderPlugin,
      widgetPlugin,
      // indentOnInput(), // works without. already brought with javascript extension?
      // bracketMatching(), // does not do anything
      syntaxHighlighting(defaultHighlightStyle),
      history(),
      EditorView.updateListener.of((v) => onChange(v)),
      drawSelection({ cursorBlinkRate: 0 }),
      Prec.highest(
        keymap.of([
          {
            key: 'Ctrl-Enter',
            run: () => onEvaluate?.(),
          },
          {
            key: 'Alt-Enter',
            run: () => onEvaluate?.(),
          },
          {
            key: 'Ctrl-.',
            run: () => onStop?.(),
          },
          {
            key: 'Alt-.',
            preventDefault: true,
            run: () => onStop?.(),
          },
          /* {
          key: 'Ctrl-Shift-.',
          run: () => (onPanic ? onPanic() : onStop?.()),
        },
        {
          key: 'Ctrl-Shift-Enter',
          run: () => (onReEvaluate ? onReEvaluate() : onEvaluate?.()),
        }, */
        ]),
      ),
    ],
  });

  return new EditorView({
    state,
    parent: root,
  });
}

export class StrudelMirror {
  constructor(options) {
    const {
      root,
      id,
      initialCode = '',
      onDraw,
      drawContext,
      drawTime = [0, 0],
      autodraw,
      prebake,
      bgFill = true,
      solo = true,
      ...replOptions
    } = options;
    this.code = initialCode;
    this.root = root;
    this.miniLocations = [];
    this.widgets = [];
    this.drawTime = drawTime;
    this.drawContext = drawContext;
    this.onDraw = onDraw || this.draw;
    this.id = id || s4();
    this.solo = solo;

    this.drawer = new Drawer((haps, time, _, painters) => {
      const currentFrame = haps.filter((hap) => hap.isActive(time));
      this.highlight(currentFrame, time);
      this.onDraw(haps, time, painters);
    }, drawTime);

    this.prebaked = prebake();
    autodraw && this.drawFirstFrame();
    this.repl = repl({
      ...replOptions,
      id,
      onToggle: (started) => {
        replOptions?.onToggle?.(started);
        if (started) {
          this.drawer.start(this.repl.scheduler);
          if (this.solo) {
            // stop other repls when this one is started
            document.dispatchEvent(
              new CustomEvent('start-repl', {
                detail: this.id,
              }),
            );
          }
        } else {
          this.drawer.stop();
          updateMiniLocations(this.editor, []);
          cleanupDraw(true, id);
        }
      },
      beforeEval: async () => {
        cleanupDraw(true, id);
        await this.prebaked;
        await replOptions?.beforeEval?.();
      },
      afterEval: (options) => {
        // remember for when highlighting is toggled on
        this.miniLocations = options.meta?.miniLocations;
        this.widgets = options.meta?.widgets;
        const sliders = this.widgets.filter((w) => w.type === 'slider');
        updateSliderWidgets(this.editor, sliders);
        const widgets = this.widgets.filter((w) => w.type !== 'slider');
        updateWidgets(this.editor, widgets);
        updateMiniLocations(this.editor, this.miniLocations);
        replOptions?.afterEval?.(options);
        // if no painters are set (.onPaint was not called), then we only need the present moment (for highlighting)
        const drawTime = options.pattern.getPainters().length ? this.drawTime : [0, 0];
        this.drawer.setDrawTime(drawTime);
        // invalidate drawer after we've set the appropriate drawTime
        this.drawer.invalidate(this.repl.scheduler);
      },
    });
    this.editor = initEditor({
      root,
      initialCode,
      onChange: (v) => {
        if (v.docChanged) {
          this.code = v.state.doc.toString();
          this.repl.setCode?.(this.code);
        }
      },
      onEvaluate: () => this.evaluate(),
      onStop: () => this.stop(),
    });
    const cmEditor = this.root.querySelector('.cm-editor');
    if (cmEditor) {
      this.root.style.display = 'block';
      if (bgFill) {
        this.root.style.backgroundColor = 'var(--background)';
      }
      cmEditor.style.backgroundColor = 'transparent';
    }
    const settings = codemirrorSettings.get();
    this.setFontSize(settings.fontSize);
    this.setFontFamily(settings.fontFamily);

    // stop this repl when another repl is started
    this.onStartRepl = (e) => {
      if (this.solo && e.detail !== this.id) {
        this.stop();
      }
    };
    document.addEventListener('start-repl', this.onStartRepl);
  }
  draw(haps, time, painters) {
    painters?.forEach((painter) => painter(this.drawContext, time, haps, this.drawTime));
  }
  async drawFirstFrame() {
    if (!this.onDraw) {
      return;
    }
    // draw first frame instantly
    await this.prebaked;
    try {
      await this.repl.evaluate(this.code, false);
      this.drawer.invalidate(this.repl.scheduler, -0.001);
      // draw at -0.001 to avoid haps at 0 to be visualized as active
      this.onDraw?.(this.drawer.visibleHaps, -0.001, this.drawer.painters);
    } catch (err) {
      console.warn('first frame could not be painted');
    }
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
      this.repl.stop();
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
  setFontSize(size) {
    this.root.style.fontSize = size + 'px';
  }
  setFontFamily(family) {
    this.root.style.fontFamily = family;
    const scroller = this.root.querySelector('.cm-scroller');
    if (scroller) {
      scroller.style.fontFamily = family;
    }
  }
  reconfigureExtension(key, value) {
    if (!extensions[key]) {
      console.warn(`extension ${key} is not known`);
      return;
    }
    value = parseBooleans(value);
    const newValue = extensions[key](value, this);
    this.editor.dispatch({
      effects: compartments[key].reconfigure(newValue),
    });
    if (key === 'theme') {
      activateTheme(value);
    }
  }
  setLineWrappingEnabled(enabled) {
    this.reconfigureExtension('isLineWrappingEnabled', enabled);
  }
  setBracketMatchingEnabled(enabled) {
    this.reconfigureExtension('isBracketMatchingEnabled', enabled);
  }
  setLineNumbersDisplayed(enabled) {
    this.reconfigureExtension('isLineNumbersDisplayed', enabled);
  }
  setBracketClosingEnabled(enabled) {
    this.reconfigureExtension('isBracketClosingEnabled', enabled);
  }
  setTheme(theme) {
    this.reconfigureExtension('theme', theme);
  }
  setAutocompletionEnabled(enabled) {
    this.reconfigureExtension('isAutoCompletionEnabled', enabled);
  }
  updateSettings(settings) {
    this.setFontSize(settings.fontSize);
    this.setFontFamily(settings.fontFamily);
    for (let key in extensions) {
      this.reconfigureExtension(key, settings[key]);
    }
    const updated = { ...codemirrorSettings.get(), ...settings };
    codemirrorSettings.set(updated);
  }
  changeSetting(key, value) {
    if (extensions[key]) {
      this.reconfigureExtension(key, value);
      return;
    } else if (key === 'fontFamily') {
      this.setFontFamily(value);
    } else if (key === 'fontSize') {
      this.setFontSize(value);
    }
  }
  setCode(code) {
    const changes = { from: 0, to: this.editor.state.doc.length, insert: code };
    this.editor.dispatch({ changes });
  }
  clear() {
    this.onStartRepl && document.removeEventListener('start-repl', this.onStartRepl);
  }
  getCursorLocation() {
    return this.editor.state.selection.main.head;
  }
  setCursorLocation(col) {
    return this.editor.dispatch({ selection: { anchor: col } });
  }
  appendCode(code) {
    const cursor = this.getCursorLocation();
    this.setCode(this.code + code);
    this.setCursorLocation(cursor);
  }
}

function parseBooleans(value) {
  return { true: true, false: false }[value] ?? value;
}

// helper function to generate repl ids
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

/**
 * Overrides the css of highlighted events. Make sure to use single quotes!
 * @name markcss
 * @example
 * note("c a f e")
 * .markcss('text-decoration:underline')
 */
export const markcss = registerControl('markcss');
