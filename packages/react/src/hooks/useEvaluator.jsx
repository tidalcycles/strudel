import { useRef, useState, useCallback, useEffect } from 'react';

function useEvaluator(code, evalOnMount = true) {
  const [error, setError] = useState();
  const [activeCode, setActiveCode] = useState(code);
  const [pattern, setPattern] = useState();
  const isDirty = code !== activeCode;
  const evaluate = useCallback(() => {
    try {
      // TODO: use @strudel.cycles/eval or let user inject custom eval function
      const _pattern = eval(code);
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
      evaluate();
    }
    inited.current = true;
  }, [evaluate, evalOnMount]);
  return { error, evaluate, activeCode, pattern, isDirty };
}

export default useEvaluator;
