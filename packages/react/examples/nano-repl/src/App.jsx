import '@strudel.cycles/core';
import controls from '@strudel.cycles/core/controls.mjs';
import { evalScope } from '@strudel.cycles/eval';
import { webaudioOutput } from '@strudel.cycles/webaudio';
import { useState } from 'react';
import useScheduler from '../../../src/hooks/useScheduler';
import useEvaluator from '../../../src/hooks/useEvaluator';
// import { prebake } from '../../../../../repl/src/prebake.mjs';

await evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/webdirt'),
  import('@strudel.cycles/serial'),
  import('@strudel.cycles/soundfonts'),
);

// await prebake();

function App() {
  const [code, setCode] = useState(`"c3 [eb3,g3]".note()`);
  const { evaluate, pattern, isDirty, error: evaluatorError } = useEvaluator({ code });
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
