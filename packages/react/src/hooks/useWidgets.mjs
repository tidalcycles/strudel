import { useEffect, useState } from 'react';
import { updateWidgets } from '@strudel/codemirror';

// i know this is ugly.. in the future, repl needs to run without react
export function useWidgets(view) {
  const [widgets, setWidgets] = useState([]);
  useEffect(() => {
    if (view) {
      updateWidgets(view, widgets);
    }
  }, [view, widgets]);
  return { widgets, setWidgets };
}
