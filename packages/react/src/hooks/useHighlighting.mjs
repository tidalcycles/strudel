import { useEffect } from 'react';
import { setHighlights } from '../components/CodeMirror6';
import { Tone } from '@strudel.cycles/tone';

let highlights = []; // actively highlighted events
let lastEnd;

function useHighlighting({ view, pattern, active }) {
  useEffect(() => {
    if (view) {
      if (pattern && active) {
        let frame = requestAnimationFrame(updateHighlights);

        function updateHighlights() {
          try {
            const audioTime = Tone.getTransport().seconds;
            // force min framerate of 10 fps => fixes crash on tab refocus, where lastEnd could be far away
            // see https://github.com/tidalcycles/strudel/issues/108
            const begin = Math.max(lastEnd || audioTime, audioTime - 1 / 10);
            const span = [begin, audioTime + 1 / 60];
            lastEnd = audioTime + 1 / 60;
            highlights = highlights.filter((hap) => hap.whole.end > audioTime); // keep only highlights that are still active
            const haps = pattern.queryArc(...span).filter((hap) => hap.hasOnset());
            highlights = highlights.concat(haps); // add potential new onsets
            view.dispatch({ effects: setHighlights.of(highlights) }); // highlight all still active + new active haps
          } catch (err) {
            // console.log('error in updateHighlights', err);
            view.dispatch({ effects: setHighlights.of([]) });
          }
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
  }, [pattern, active, view]);
}

export default useHighlighting;
