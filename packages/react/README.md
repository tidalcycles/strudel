# @strudel.cycles/react

This package contains react hooks and components for strudel. It is used internally by the Strudel REPL.

## Install

```js
npm i @strudel.cycles/react
```

## Usage

Here is a minimal example of how to set up a MiniRepl:

```jsx
import { evalScope } from '@strudel.cycles/eval';
import { MiniRepl } from '@strudel.cycles/react';
import controls from '@strudel.cycles/core/controls.mjs';
import { prebake } from '../repl/src/prebake.mjs';

evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/webaudio'),
  /* probably import other strudel packages */
);

prebake();

export function Repl({ tune }) {
  return <MiniRepl tune={tune} hideOutsideView={true} />;
}
```

## Development

If you change something in here and want to see the changes in the repl, make sure to run `npm run build` inside this folder!

```js
npm run dev # dev server
npm run build # build package
```
