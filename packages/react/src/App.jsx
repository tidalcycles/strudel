import React from 'react';
import { MiniRepl } from './components/MiniRepl';
import 'tailwindcss/tailwind.css';
import { evalScope } from '@strudel.cycles/eval';
import { controls } from '@strudel.cycles/core';

evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
);

function App() {
  return (
    <div>
      <MiniRepl tune={`note("c3")`} />
    </div>
  );
}

export default App;
