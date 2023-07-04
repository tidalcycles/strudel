import React, { useMemo } from 'react';
import _CodeMirror from '@uiw/react-codemirror';
import { EditorView, Decoration } from '@codemirror/view';
import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import strudelTheme from '../themes/strudel-theme';
import './style.css';
import { useCallback } from 'react';
import { autocompletion } from '@codemirror/autocomplete';
import { strudelAutocomplete } from './Autocomplete';
import { vim } from '@replit/codemirror-vim';
import { emacs } from '@replit/codemirror-emacs';

export const setFlash = StateEffect.define();
const flashField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(flash, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setFlash)) {
          if (e.value && tr.newDoc?.length?.length > 0) {
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

export const flash = (view) => {
  view.dispatch({ effects: setFlash.of(true) });
  setTimeout(() => {
    view.dispatch({ effects: setFlash.of(false) });
  }, 200);
};

export const setMiniLocations = StateEffect.define();
export const showMiniLocations = StateEffect.define();
export const updateMiniLocations = (view, locations) => {
  view.dispatch({ effects: setMiniLocations.of(locations) });
};
export const highlightMiniLocations = (view, atTime, haps) => {
  view.dispatch({ effects: showMiniLocations.of({ atTime, haps }) });
};

const miniLocations = StateField.define({
  create() {
    return Decoration.none;
  },
  update(locations, tr) {
    if (tr.docChanged) {
      locations = locations.map(tr.changes);
    }

    for (let e of tr.effects) {
      if (e.is(setMiniLocations)) {
        // this is called on eval, with the mini locations obtained from the transpiler
        // codemirror will automatically remap the marks when the document is edited
        // create a mark for each mini location, adding the range to the spec to find it later
        const marks = e.value
          .filter(([from]) => from < tr.newDoc.length)
          .map(([from, to]) => [from, Math.min(to, tr.newDoc.length)])
          .map(
            (range) =>
              Decoration.mark({
                id: range.join(':'),
                // this green is only to verify that the decoration moves when the document is edited
                // it will be removed later, so the mark is not visible by default
                attributes: { style: `background-color: #00CA2880` },
              }).range(...range), // -> Decoration
          );

        locations = Decoration.set(marks, true); // -> DecorationSet === RangeSet<Decoration>
      }
    }

    return locations;
  },
});

const visibleMiniLocations = StateField.define({
  create() {
    return { atTime: 0, haps: new Map() };
  },
  update(visible, tr) {
    for (let e of tr.effects) {
      if (e.is(showMiniLocations)) {
        // this is called every frame to show the locations that are currently active
        // we can NOT create new marks because the context.locations haven't changed since eval time
        // this is why we need to find a way to update the existing decorations, showing the ones that have an active range
        const haps = new Map();
        for (let hap of e.value.haps) {
          for (let { start, end } of hap.context.locations) {
            let id = `${start}:${end}`;
            if (!haps.has(id) || haps.get(id).whole.begin.lt(hap.whole.begin)) {
              haps.set(id, hap);
            }
          }
        }

        visible = { atTime: e.value.atTime, haps };
      }
    }

    return visible;
  },
});

// // Derive the set of decorations from the miniLocations and visibleLocations
const miniLocationHighlights = EditorView.decorations.compute([miniLocations, visibleMiniLocations], (state) => {
  const iterator = state.field(miniLocations).iter();
  const { atTime, haps } = state.field(visibleMiniLocations);
  const builder = new RangeSetBuilder();

  while (!!iterator.value) {
    const {
      from,
      to,
      value: {
        spec: { id },
      },
    } = iterator;

    if (haps.has(id)) {
      const hap = haps.get(id);
      const color = hap.context.color ?? 'var(--foreground)';

      // Get explicit channels for color values
      /* 
      const swatch = document.createElement('div');
      swatch.style.color = color;
      document.body.appendChild(swatch);
      let channels = getComputedStyle(swatch)
        .color.match(/^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d*(?:\.\d+)?))?\)$/)
        .slice(1)
        .map((c) => parseFloat(c || 1));
      document.body.removeChild(swatch);

      // Get percentage of event
      const percent = 1 - (atTime - hap.whole.begin) / hap.whole.duration;
      channels[3] *= percent;
      */

      builder.add(
        from,
        to,
        Decoration.mark({
          // attributes: { style: `outline: solid 2px rgba(${channels.join(', ')})` },
          attributes: { style: `outline: solid 2px ${color}` },
        }),
      );
    }

    iterator.next();
  }

  return builder.finish();
});

const highlightExtension = [miniLocations, visibleMiniLocations, miniLocationHighlights];

export const setHighlights = StateEffect.define();
const highlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    highlights = highlights.map(tr.changes);
    try {
      for (let e of tr.effects) {
        if (e.is(setHighlights)) {
          const { haps } = e.value;
          const marks =
            haps
              .map((hap) =>
                (hap.context.locations || []).map(({ start: from, end: to }) => {
                  const color = hap.context.color || e.value.color;
                  console.log(color);
                  /* let from = tr.newDoc.line(start.line).from + start.column;
                  let to = tr.newDoc.line(end.line).from + end.column; */
                  const l = tr.newDoc.length;
                  if (from > l || to > l) {
                    return; // dont mark outside of range, as it will throw an error
                  }
                  let mark;
                  if (color) {
                    mark = Decoration.mark({ attributes: { style: `outline: 2px solid ${color};` } });
                  } else {
                    mark = Decoration.mark({ attributes: { class: `outline outline-2 outline-foreground` } });
                  }
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

const staticExtensions = [javascript(), highlightField, flashField, highlightExtension];

export default function CodeMirror({
  value,
  onChange,
  onViewChanged,
  onSelectionChange,
  onDocChange,
  theme,
  keybindings,
  isLineNumbersDisplayed,
  isAutoCompletionEnabled,
  isLineWrappingEnabled,
  fontSize = 18,
  fontFamily = 'monospace',
  options,
  editorDidMount,
}) {
  const handleOnChange = useCallback(
    (value) => {
      onChange?.(value);
    },
    [onChange],
  );

  const handleOnCreateEditor = useCallback(
    (view) => {
      onViewChanged?.(view);
    },
    [onViewChanged],
  );

  const handleOnUpdate = useCallback(
    (viewUpdate) => {
      if (viewUpdate.docChanged && onDocChange) {
        onDocChange?.(viewUpdate);
      }
      if (viewUpdate.selectionSet && onSelectionChange) {
        onSelectionChange?.(viewUpdate.state.selection);
      }
    },
    [onSelectionChange],
  );

  const extensions = useMemo(() => {
    let _extensions = [...staticExtensions];
    let bindings = {
      vim,
      emacs,
    };

    if (bindings[keybindings]) {
      _extensions.push(bindings[keybindings]());
    }

    if (isAutoCompletionEnabled) {
      _extensions.push(javascriptLanguage.data.of({ autocomplete: strudelAutocomplete }));
    } else {
      _extensions.push(autocompletion({ override: [] }));
    }

    if (isLineWrappingEnabled) {
      _extensions.push(EditorView.lineWrapping);
    }

    return _extensions;
  }, [keybindings, isAutoCompletionEnabled, isLineWrappingEnabled]);

  const basicSetup = useMemo(() => ({ lineNumbers: isLineNumbersDisplayed }), [isLineNumbersDisplayed]);

  return (
    <div style={{ fontSize, fontFamily }} className="w-full">
      <_CodeMirror
        value={value}
        theme={theme || strudelTheme}
        onChange={handleOnChange}
        onCreateEditor={handleOnCreateEditor}
        onUpdate={handleOnUpdate}
        extensions={extensions}
        basicSetup={basicSetup}
      />
    </div>
  );
}

let parenMark;
export const markParens = (editor, data) => {
  const v = editor.getDoc().getValue();
  const marked = getCurrentParenArea(v, data);
  parenMark?.clear();
  parenMark = editor.getDoc().markText(...marked, { css: 'background-color: #00007720' }); //
};

// returns { line, ch } from absolute character offset
export function offsetToPosition(offset, code) {
  const lines = code.split('\n');
  let line = 0;
  let ch = 0;
  for (let i = 0; i < offset; i++) {
    if (ch === lines[line].length) {
      line++;
      ch = 0;
    } else {
      ch++;
    }
  }
  return { line, ch };
}

// returns absolute character offset from { line, ch }
export function positionToOffset(position, code) {
  const lines = code.split('\n');
  if (position.line > lines.length) {
    // throw new Error('positionToOffset: position.line > lines.length');
    return 0;
  }
  let offset = 0;
  for (let i = 0; i < position.line; i++) {
    offset += lines[i].length + 1;
  }
  offset += position.ch;
  return offset;
}

// given code and caret position, the functions returns the indices of the parens we are in
export function getCurrentParenArea(code, caretPosition) {
  const caret = positionToOffset(caretPosition, code);
  let open, i, begin, end;
  // walk left
  i = caret;
  open = 0;
  while (i > 0) {
    if (code[i - 1] === '(') {
      open--;
    } else if (code[i - 1] === ')') {
      open++;
    }
    if (open === -1) {
      break;
    }
    i--;
  }
  begin = i;
  // walk right
  i = caret;
  open = 0;
  while (i < code.length) {
    if (code[i] === '(') {
      open--;
    } else if (code[i] === ')') {
      open++;
    }
    if (open === 1) {
      break;
    }
    i++;
  }
  end = i;
  return [begin, end].map((o) => offsetToPosition(o, code));
}

/* 
export const markEvent = (editor) => (time, event) => {
  const locs = event.context.locations;
  if (!locs || !editor) {
    return;
  }
  const col = event.context?.color || '#FFCA28';
  // mark active event
  const marks = locs.map(({ start, end }) =>
    editor.getDoc().markText(
      { line: start.line - 1, ch: start.column },
      { line: end.line - 1, ch: end.column },
      //{ css: 'background-color: #FFCA28; color: black' } // background-color is now used by parent marking
      { css: 'outline: 1px solid ' + col + '; box-sizing:border-box' },
      //{ css: `background-color: ${col};border-radius:5px` },
    ),
  );
  //Tone.Transport.schedule(() => { // problem: this can be cleared by scheduler...
  setTimeout(() => {
    marks.forEach((mark) => mark.clear());
    // }, '+' + event.duration * 0.5);
  }, event.duration * 1000);
}; */
