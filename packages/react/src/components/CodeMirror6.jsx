import React from 'react';
import _CodeMirror from '@uiw/react-codemirror';
import { EditorView, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import strudelTheme from '../themes/strudel-theme';
import './style.css';
import { useCallback } from 'react';
import { autocompletion } from '@codemirror/autocomplete';
import jsdoc from '../../../../doc.json';

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

export const flash = (view) => {
  view.dispatch({ effects: setFlash.of(true) });
  setTimeout(() => {
    view.dispatch({ effects: setFlash.of(false) });
  }, 200);
};

export const setHighlights = StateEffect.define();
const highlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setHighlights)) {
          const marks =
            e.value
              .map((hap) =>
                (hap.context.locations || []).map(({ start, end }) => {
                  const color = hap.context.color || '#FFCA28';
                  let from = tr.newDoc.line(start.line).from + start.column;
                  let to = tr.newDoc.line(end.line).from + end.column;
                  const l = tr.newDoc.length;
                  if (from > l || to > l) {
                    return; // dont mark outside of range, as it will throw an error
                  }
                  // const mark = Decoration.mark({ attributes: { style: `outline: 1px solid ${color}` } });
                  const mark = Decoration.mark({ attributes: { style: `outline: 1.5px solid ${color};` } });
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

const getDocLabel = (doc) => doc.name || doc.longname;
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
      const heading = document.createElement('h3');
      heading.innerText = getDocLabel(doc);
      heading.style = 'padding-top:0;margin-top:0';
      const description = document.createElement('div');
      description.innerHTML = doc.description;
      const params = document.createElement('ul');
      doc.params?.forEach(({ name, type, description }) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.innerText = name + ': ' + type.names?.join(' | ') + (description ? ' - ' : '');
        const c = document.createElement('span');
        c.innerHTML = description || '';
        const comment = document.createElement('span');
        comment.innerHTML = c.innerText;
        li.appendChild(span);
        li.appendChild(comment);
        params.appendChild(li);
      });
      const examples = document.createElement('div');
      doc.examples?.forEach((ex) => {
        const code = document.createElement('pre');
        code.style = 'font-size:14px';
        code.innerText = ex;
        examples.appendChild(code);
      });
      const node = document.createElement('div');
      node.classList.add('prose');
      node.classList.add('prose-invert');
      node.style = 'max-width:500px;max-height:400px;overflow:auto';
      node.appendChild(heading);
      node.appendChild(description);
      node.appendChild(params);
      node.appendChild(examples);
      return node;
    }, // Additional info to show when the completion is selected
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

const extensions = [
  javascript(),
  strudelTheme,
  highlightField,
  flashField,
  // javascriptLanguage.data.of({ autocomplete: strudelAutocomplete }),
  autocompletion({ override: [strudelAutocomplete] }),
];

export default function CodeMirror({ value, onChange, onViewChanged, onSelectionChange, options, editorDidMount }) {
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
      if (viewUpdate.selectionSet && onSelectionChange) {
        onSelectionChange?.(viewUpdate.state.selection);
      }
    },
    [onSelectionChange],
  );
  return (
    <>
      <_CodeMirror
        value={value}
        onChange={handleOnChange}
        onCreateEditor={handleOnCreateEditor}
        onUpdate={handleOnUpdate}
        extensions={extensions}
      />
    </>
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
