import { evalScope, controls } from '@strudel.cycles/core';
import { MiniRepl as _MiniRepl } from '@strudel.cycles/react';
import { samples } from '@strudel.cycles/webaudio';
import '@strudel.cycles/react/dist/style.css';

samples('github:tidalcycles/Dirt-Samples/master')

evalScope(
  controls,
  import('@strudel.cycles/core'),
  // import('@strudel.cycles/tone'),
  // import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  // import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
);

export function MiniRepl({ tune }) {
  return <_MiniRepl tune={tune} hideOutsideView={true} />;
}
