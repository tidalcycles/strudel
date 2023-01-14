import { useCallback, useEffect, useRef } from 'react';
import 'tailwindcss/tailwind.css';
import useFrame from '../hooks/useFrame.mjs';

function usePatternFrame({ pattern, started, getTime, onDraw, drawTime = [-2, 2] }) {
  let [lookbehind, lookahead] = drawTime;
  lookbehind = Math.abs(lookbehind);
  let visibleHaps = useRef([]);
  let lastFrame = useRef(null);
  useEffect(() => {
    if (pattern) {
      const t = getTime();
      const futureHaps = pattern.queryArc(Math.max(t, 0), t + lookahead + 0.1); // +0.1 = workaround for weird holes in query..
      visibleHaps.current = visibleHaps.current.filter((h) => h.whole.begin < t);
      visibleHaps.current = visibleHaps.current.concat(futureHaps);
    }
  }, [pattern]);
  const { start: startFrame, stop: stopFrame } = useFrame(
    useCallback(() => {
      const phase = getTime() + lookahead;
      if (lastFrame.current === null) {
        lastFrame.current = phase;
        return;
      }
      const haps = pattern.queryArc(Math.max(lastFrame.current, phase - 1 / 10), phase);
      lastFrame.current = phase;
      visibleHaps.current = (visibleHaps.current || [])
        .filter((h) => h.whole.end >= phase - lookbehind - lookahead) // in frame
        .concat(haps.filter((h) => h.hasOnset()));
      onDraw(pattern, phase - lookahead, visibleHaps.current, drawTime);
    }, [pattern]),
  );
  useEffect(() => {
    if (started) {
      startFrame();
    } else {
      visibleHaps.current = [];
      stopFrame();
    }
  }, [started]);
  return {
    clear: () => {
      visibleHaps.current = [];
    },
  };
}

export default usePatternFrame;
