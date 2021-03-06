import React from 'react';
import { MiniRepl } from './components/MiniRepl';
import 'tailwindcss/tailwind.css';
import { Tone, getDefaultSynth } from '@strudel.cycles/tone';
import { evalScope } from '@strudel.cycles/eval';

const defaultSynth = getDefaultSynth();

evalScope(
  Tone,
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
      <MiniRepl tune={`"c3"`} defaultSynth={defaultSynth} />
    </div>
  );
}

export default App;
