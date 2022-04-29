import { useEffect } from 'react';
import { setHighlights } from './CodeMirror6';
import { Tone } from '@strudel.cycles/tone';

function useHighlighting({ view, pattern, started }) {
  useEffect(() => {
    if (view) {
      if (pattern && started) {
        let frame = requestAnimationFrame(updateHighlights);

        function updateHighlights() {
          const audioTime = Tone.getTransport().seconds;
          const span = { begin: audioTime, end: audioTime + 1 / 60 };
          // TODO: remove isActive workaround when query is fixed
          const isActive = (event) => event.whole.end >= span.begin && event.whole.begin <= span.end;
          const events = pattern.queryArc(span.begin, span.end).filter(isActive);
          view.dispatch({ effects: setHighlights.of(events) });
          frame = requestAnimationFrame(updateHighlights);
        }

        return () => {
          cancelAnimationFrame(frame);
        };
      } else {
        view.dispatch({ effects: setHighlights.of([]) });
      }
    }
  }, [pattern, started, view]);
}

export default useHighlighting;
