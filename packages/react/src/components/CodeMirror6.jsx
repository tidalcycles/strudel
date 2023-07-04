import { autocompletion } from '@codemirror/autocomplete';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { emacs } from '@replit/codemirror-emacs';
import { vim } from '@replit/codemirror-vim';
import _CodeMirror from '@uiw/react-codemirror';
import React, { useCallback, useMemo } from 'react';
import strudelTheme from '../themes/strudel-theme';
import { strudelAutocomplete } from './Autocomplete';
import {
  highlightExtension,
  flashField,
  flash,
  highlightMiniLocations,
  updateMiniLocations,
} from '@strudel/codemirror';
import './style.css';

export { flash, highlightMiniLocations, updateMiniLocations };

const staticExtensions = [javascript(), flashField, highlightExtension];

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
