import { useEffect, useRef } from 'react';

function useFrame(callback, autostart = false) {
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const animate = (time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(time, deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  const start = () => {
    requestRef.current = requestAnimationFrame(animate);
  };
  const stop = () => {
    requestRef.current && cancelAnimationFrame(requestRef.current);
    delete requestRef.current;
  };
  useEffect(() => {
    if (requestRef.current) {
      stop();
      start();
    }
  }, [callback]);

  useEffect(() => {
    if (autostart) {
      start();
    }
    return stop;
  }, []); // Make sure the effect only runs once

  return {
    start,
    stop,
  };
}

export default useFrame;
