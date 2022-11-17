import { evalScope, controls } from '@strudel.cycles/core';
import { MiniRepl as _MiniRepl } from '@strudel.cycles/react';
import { samples } from '@strudel.cycles/webaudio';
import { prebake } from '../repl/src/prebake.mjs';

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

// prebake();

export function MiniRepl({ tune }) {
  return <_MiniRepl tune={tune} hideOutsideView={true} />;
}
