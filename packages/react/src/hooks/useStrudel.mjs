import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { repl } from '@strudel.cycles/core/repl.mjs';
import { transpiler } from '@strudel.cycles/transpiler';

function useStrudel({ defaultOutput, interval, getTime, code, evalOnMount = false }) {
  // scheduler
  const [schedulerError, setSchedulerError] = useState();
  const [evalError, setEvalError] = useState();
  const [activeCode, setActiveCode] = useState(code);
  const [pattern, setPattern] = useState();
  const [started, setStarted] = useState(false);
  const isDirty = code !== activeCode;
  // TODO: make sure this hook reruns when scheduler.started changes
  const { scheduler, evaluate: _evaluate } = useMemo(
    () =>
      repl({
        interval,
        defaultOutput,
        onSchedulerError: setSchedulerError,
        onEvalError: setEvalError,
        getTime,
        transpiler,
        onEval: ({ pattern: _pattern, code }) => {
          setActiveCode(code);
          setPattern(_pattern);
          setEvalError();
        },
        onToggle: (v) => setStarted(v),
        onEvalError: setEvalError,
      }),
    [defaultOutput, interval, getTime],
  );
  const evaluate = useCallback(() => _evaluate(code), [_evaluate, code]);

  const inited = useRef();
  useEffect(() => {
    if (!inited.current && evalOnMount && code) {
      console.log('eval on mount');
      inited.current = true;
      evaluate();
    }
  }, [evaluate, evalOnMount, code]);

  const togglePlay = async () => {
    if (started) {
      scheduler.pause();
      // scheduler.stop();
    } else {
      await evaluate();
    }
  };

  return { schedulerError, scheduler, evalError, evaluate, activeCode, isDirty, pattern, started, togglePlay };
}

export default useStrudel;
