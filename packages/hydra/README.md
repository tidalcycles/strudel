# @strudel/hydra

This package integrates [hydra-synth](https://www.npmjs.com/package/hydra-synth) into strudel.

## Usage in Strudel

This package is imported into strudel by default. To activate Hydra, place this code at the top of your code:

```js
await initHydra();
```

Then you can use hydra below!

### options

You can also pass options to the `initHydra` function. These can be used to set [hydra options](https://github.com/hydra-synth/hydra-synth#api) + these strudel specific options:

- `feedStrudel`: sends the strudel canvas to `s0`. The strudel canvas is used to draw `pianoroll`, `spiral`, `scope` etc..

## Usage via npm

```sh
npm i @strudel/hydra
```

Then add the import to your evalScope:

```js
import { evalScope } from '@strudel/core';

evalScope(
  import('@strudel/hydra')
)
```
