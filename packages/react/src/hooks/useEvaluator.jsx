import { useRef, useState, useCallback, useEffect } from 'react';
import { evaluate as _evaluate } from '@strudel.cycles/eval';

function useEvaluator({ code, evalOnMount = true }) {
  const [error, setError] = useState();
  const [activeCode, setActiveCode] = useState(code);
  const [pattern, setPattern] = useState();
  const isDirty = code !== activeCode;

  const evaluate = useCallback(async () => {
    if (!code) {
      console.log('no code..');
      return;
    }
    try {
      // TODO: let user inject custom eval function?
      const { pattern: _pattern } = await _evaluate(code);
      setActiveCode(activeCode);
      setPattern(_pattern);
      setError();
    } catch (err) {
      setError(err);
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
  return { error, evaluate, activeCode, pattern, isDirty };
}

export default useEvaluator;
