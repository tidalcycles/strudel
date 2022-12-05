import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import core from '@strudel.cycles/core';
const repl  = core.repl
import { transpiler } from '@strudel.cycles/transpiler';
import usePostMessage from './usePostMessage.mjs';

function useStrudel({
  defaultOutput,
  interval,
  getTime,
  evalOnMount = false,
  initialCode = '',
  autolink = false,
  beforeEval,
  afterEval,
  onEvalError,
  onToggle,
}) {
  const id = useMemo(() => s4(), []);
  // scheduler
  const [schedulerError, setSchedulerError] = useState();
  const [evalError, setEvalError] = useState();
  const [code, setCode] = useState(initialCode);
  const [activeCode, setActiveCode] = useState();
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
        onEvalError: (err) => {
          setEvalError(err);
          onEvalError?.(err);
        },
        getTime,
        transpiler,
        beforeEval: ({ code }) => {
          setCode(code);
          beforeEval?.();
        },
        afterEval: ({ pattern: _pattern, code }) => {
          setActiveCode(code);
          setPattern(_pattern);
          setEvalError();
          setSchedulerError();
          if (autolink) {
            window.location.hash = '#' + encodeURIComponent(btoa(code));
          }
          afterEval?.();
        },
        onToggle: (v) => {
          setStarted(v);
          onToggle?.(v);
        },
      }),
    [defaultOutput, interval, getTime],
  );
  const broadcast = usePostMessage(({ data: { from, type } }) => {
    if (type === 'start' && from !== id) {
      // console.log('message', from, type);
      stop();
    }
  });
  const activateCode = useCallback(
    async (autostart = true) => {
      await evaluate(code, autostart);
      broadcast({ type: 'start', from: id });
    },
    [evaluate, code],
  );

  const inited = useRef();
  useEffect(() => {
    if (!inited.current && evalOnMount && code) {
      inited.current = true;
      activateCode();
    }
  }, [activateCode, evalOnMount, code]);

  // this will stop the scheduler when hot reloading in development
  useEffect(() => {
    return () => {
      scheduler.stop();
    };
  }, [scheduler]);

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

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}
