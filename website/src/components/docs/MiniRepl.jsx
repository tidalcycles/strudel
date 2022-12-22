import { evalScope, controls } from '@strudel.cycles/core';
import { samples } from '@strudel.cycles/webaudio';
import { useEffect, useState } from 'react';

if (typeof window !== 'undefined') {
  fetch('https://strudel.tidalcycles.org/EmuSP12.json')
    .then((res) => res.json())
    .then((json) => samples(json, 'https://strudel.tidalcycles.org/EmuSP12/'));

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

// prebake();

export function MiniRepl({ tune }) {
  const [Repl, setRepl] = useState();
  useEffect(() => {
    // we have to load this package on the client
    // because codemirror throws an error on the server
    import('@strudel.cycles/react').then((res) => {
      setRepl(() => res.MiniRepl);
    });
  }, []);
  return Repl ? <Repl tune={tune} hideOutsideView={true} /> : <pre>{tune}</pre>;
}
