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
          const events = pattern.queryArc(audioTime, audioTime + 1 / 60);
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
