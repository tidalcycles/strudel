import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { repl } from '@strudel.cycles/core/repl.mjs';
import { transpiler } from '@strudel.cycles/transpiler';

function useStrudel({ defaultOutput, interval, getTime, evalOnMount = false, initialCode = '', autolink = false }) {
  // scheduler
  const [schedulerError, setSchedulerError] = useState();
  const [evalError, setEvalError] = useState();
  const [code, setCode] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(code);
  const [pattern, setPattern] = useState();
  const [started, setStarted] = useState(false);
  const isDirty = code !== activeCode;

  // TODO: make sure this hook reruns when scheduler.started changes
  const { scheduler, evaluate, start, stop, pause } = useMemo(
    () =>
      repl({
        interval,
        defaultOutput,
        onSchedulerError: setSchedulerError,
        onEvalError: setEvalError,
        getTime,
        transpiler,
        beforeEval: ({ code }) => {
          setCode(code);
        },
        onEvalError: setEvalError,
        afterEval: ({ pattern: _pattern, code }) => {
          setActiveCode(code);
          setPattern(_pattern);
          setEvalError();
          if (autolink) {
            window.location.hash = '#' + encodeURIComponent(btoa(code));
          }
        },
        onToggle: (v) => setStarted(v),
      }),
    [defaultOutput, interval, getTime],
  );
  const activateCode = useCallback(async (autostart = true) => evaluate(code, autostart), [evaluate, code]);

  const inited = useRef();
  useEffect(() => {
    if (!inited.current && evalOnMount && code) {
      inited.current = true;
      activateCode();
    }
  }, [activateCode, evalOnMount, code]);

  const togglePlay = async () => {
    if (started) {
      scheduler.pause();
    } else {
      await activateCode();
    }
  };
  const error = schedulerError || evalError;
  return {
    code,
    setCode,
    error,
    schedulerError,
    scheduler,
    evalError,
    evaluate,
    activateCode,
    activeCode,
    isDirty,
    pattern,
    started,
    start,
    stop,
    pause,
    togglePlay,
  };
}

export default useStrudel;
