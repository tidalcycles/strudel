import { useCallback, useEffect, useRef } from 'react';
import 'tailwindcss/tailwind.css';
import useFrame from '../hooks/useFrame.mjs';

function usePatternFrame({ pattern, started, getTime, onDraw }) {
  let visibleHaps = useRef([]);
  let lastFrame = useRef(null);
  const { start: startFrame, stop: stopFrame } = useFrame(
    useCallback(() => {
      const phase = getTime();
      if (lastFrame.current === null) {
        lastFrame.current = phase;
        return;
      }
      const haps = pattern.queryArc(Math.max(lastFrame.current, phase - 1 / 10), phase);
      const cycles = 4;
      lastFrame.current = phase;
      visibleHaps.current = (visibleHaps.current || [])
        .filter((h) => h.whole.end > phase - cycles) // in frame
        .concat(haps.filter((h) => h.hasOnset()));
      onDraw(phase, visibleHaps.current);
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
}

export default usePatternFrame;
