import { Scheduler } from '@strudel.cycles/core';
import { useEffect, useMemo, useState } from 'react';

function useScheduler(pattern, defaultOutput, interval = 0.1) {
  const [error, setError] = useState();
  // TODO: how / when to remove schedulerError?
  const scheduler = useMemo(
    () => new Scheduler({ interval, onTrigger: defaultOutput, onError: setError }),
    [defaultOutput, interval],
  );
  useEffect(() => {
    // console.log('pattern', pattern);
    pattern && scheduler?.setPattern(pattern);
  }, [pattern, scheduler]);
  return { error, scheduler };
}

export default useScheduler;
