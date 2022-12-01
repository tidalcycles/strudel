import { useEffect, useRef } from 'react';
import { setHighlights } from '../components/CodeMirror6';

function useHighlighting({ view, pattern, active, getTime }) {
  const highlights = useRef([]);
  const lastEnd = useRef();
  useEffect(() => {
    if (view) {
      if (pattern && active) {
        let frame = requestAnimationFrame(function updateHighlights() {
          try {
            const audioTime = getTime();
            // force min framerate of 10 fps => fixes crash on tab refocus, where lastEnd could be far away
            // see https://github.com/tidalcycles/strudel/issues/108
            const begin = Math.max(lastEnd.current || audioTime, audioTime - 1 / 10, 0); // negative time seems buggy
            const span = [begin, audioTime + 1 / 60];
            lastEnd.current = span[1];
            highlights.current = highlights.current.filter((hap) => hap.whole.end > audioTime); // keep only highlights that are still active
            const haps = pattern.queryArc(...span).filter((hap) => hap.hasOnset());
            highlights.current = highlights.current.concat(haps); // add potential new onsets
            view.dispatch({ effects: setHighlights.of(highlights.current) }); // highlight all still active + new active haps
          } catch (err) {
            view.dispatch({ effects: setHighlights.of([]) });
          }
          frame = requestAnimationFrame(updateHighlights);
        });
        return () => {
          cancelAnimationFrame(frame);
        };
      } else {
        highlights.current = [];
        view.dispatch({ effects: setHighlights.of([]) });
      }
    }
  }, [pattern, active, view]);
}

export default useHighlighting;
