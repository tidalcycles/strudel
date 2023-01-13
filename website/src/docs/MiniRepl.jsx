import { evalScope, controls } from '@strudel.cycles/core';
import { initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import { useEffect, useState } from 'react';
import { prebake } from '../repl/prebake';

if (typeof window !== 'undefined') {
  evalScope(
    controls,
    import('@strudel.cycles/core'),
    // import('@strudel.cycles/tone'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/midi'),
    import('@strudel.cycles/xen'),
    import('@strudel.cycles/webaudio'),
    import('@strudel.cycles/osc'),
  );
}

if (typeof window !== 'undefined') {
  initAudioOnFirstClick();
  prebake();
}

export function MiniRepl({ tune, drawTime, punchcard, canvasHeight = 100 }) {
  const [Repl, setRepl] = useState();
  useEffect(() => {
    // we have to load this package on the client
    // because codemirror throws an error on the server
    import('@strudel.cycles/react').then((res) => {
      setRepl(() => res.MiniRepl);
    });
  }, []);
  return Repl ? (
    <div className="mb-4">
      <Repl tune={tune} hideOutsideView={true} drawTime={drawTime} punchcard={punchcard} canvasHeight={canvasHeight} />
    </div>
  ) : (
    <pre>{tune}</pre>
  );
}
