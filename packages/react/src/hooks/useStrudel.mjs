import { Scheduler } from '@strudel.cycles/core';
import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { evaluate as _evaluate } from '@strudel.cycles/eval';

function useStrudel({ defaultOutput, interval, getTime, code, evalOnMount = false }) {
  // scheduler
  const [schedulerError, setSchedulerError] = useState();
  const [evalError, setEvalError] = useState();
  const [activeCode, setActiveCode] = useState(code);
  const isDirty = code !== activeCode;
  // TODO: how / when to remove schedulerError?
  const scheduler = useMemo(
    () => new Scheduler({ interval, onTrigger: defaultOutput, onError: setSchedulerError, getTime }),
    [defaultOutput, interval],
  );
  const evaluate = useCallback(async () => {
    if (!code) {
      console.log('no code..');
      return;
    }
    try {
      // TODO: let user inject custom eval function?
      const { pattern } = await _evaluate(code);
      setActiveCode(code);
      scheduler?.setPattern(pattern);
      setEvalError();
    } catch (err) {
      setEvalError(err);
      console.warn('eval error', err);
    }
  }, [code, scheduler]);

  const inited = useRef();
  useEffect(() => {
    if (!inited.current && evalOnMount) {
      inited.current = true;
      evaluate();
    }
  }, [evaluate, evalOnMount]);

  return { schedulerError, scheduler, evalError, evaluate, activeCode, isDirty };
}

export default useStrudel;
