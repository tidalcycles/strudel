import { useEffect } from 'react';
import { setHighlights } from './CodeMirror6';
import { Tone } from '@strudel.cycles/tone';

let highlights = []; // actively highlighted events

function useHighlighting({ view, pattern, started }) {
  useEffect(() => {
    if (view) {
      if (pattern && started) {
        let frame = requestAnimationFrame(updateHighlights);

        function updateHighlights() {
          const audioTime = Tone.getTransport().seconds;
          highlights = highlights.filter((hap) => hap.whole.end > audioTime); // keep only highlights that are still active
          const haps = pattern.queryArc(audioTime, audioTime + 1 / 60).filter((hap) => hap.hasOnset());
          highlights = highlights.concat(haps); // add potential new onsets
          view.dispatch({ effects: setHighlights.of(highlights) }); // highlight all still active + new active haps
          frame = requestAnimationFrame(updateHighlights);
        }

        return () => {
          cancelAnimationFrame(frame);
        };
      } else {
        highlights = [];
        view.dispatch({ effects: setHighlights.of([]) });
      }
    }
  }, [pattern, started, view]);
}

export default useHighlighting;
