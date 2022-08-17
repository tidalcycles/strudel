import * as strudel from '@strudel.cycles/core';
import * as webaudio from '@strudel.cycles/webaudio';
import { webaudioOutput } from '@strudel.cycles/webaudio';
import { useState } from 'react';
import useScheduler from '../../../src/hooks/useScheduler';
import useEvaluator from '../../../src/hooks/useEvaluator';

Object.assign(globalThis, strudel, webaudio); // add strudel to eval scope

function App() {
  const [code, setCode] = useState(`seq('c3','eb3').note()`);
  const { evaluate, pattern, isDirty, error: evaluatorError } = useEvaluator(code);
  const { scheduler, error: schedulerError } = useScheduler(pattern, webaudioOutput);
  const error = evaluatorError || schedulerError;
  return (
    <div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} cols="64" rows="30" />
      <br />
      <button onClick={() => scheduler.start()}>start</button>
      <button onClick={() => scheduler.stop()}>stop</button>
      {isDirty && <button onClick={() => evaluate()}>eval</button>}
      {error && <p>error {error.message}</p>}
    </div>
  );
}

export default App;
