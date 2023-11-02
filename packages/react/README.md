# @strudel.cycles/react

This package contains react hooks and components for strudel. It is used internally by the Strudel REPL.

## Install

```js
npm i @strudel.cycles/react
```

## Usage

Here is a minimal example of how to set up a MiniRepl:

```jsx
import * as React from 'react';
import '@strudel.cycles/react/dist/style.css';
import { MiniRepl } from '@strudel.cycles/react';
import { evalScope, controls } from '@strudel.cycles/core';
import { samples, initAudioOnFirstClick } from '@strudel.cycles/webaudio';

async function prebake() {
  await samples(
    'https://strudel.cc/tidal-drum-machines.json',
    'github:ritchse/tidal-drum-machines/main/machines/'
  );
  await samples(
    'https://strudel.cc/EmuSP12.json',
    'https://strudel.cc/EmuSP12/'
  );
}

async function init() {
  await evalScope(
    controls,
    import('@strudel.cycles/core'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/webaudio'),
    import('@strudel.cycles/tonal')
  );
  await prebake();
  initAudioOnFirstClick();
}

if (typeof window !== 'undefined') {
  init();
}

export default function App() {
  return <MiniRepl tune={`s("bd sd,hh*4")`} />;
}
```

- Open [example on stackblitz](https://stackblitz.com/edit/react-ts-saaair?file=tune.tsx,App.tsx)
- Also check out the [nano-repl](./examples/nano-repl/) for a more sophisticated example
