# @strudel/hydra

This package integrates [hydra-synth](https://www.npmjs.com/package/hydra-synth) into strudel.

## Usage in Strudel

This package is imported into strudel by default. To activate Hydra, place this code at the top of your code:

```js
await initHydra();
```

Then you can use hydra below!

## Usage via npm

```sh
npm i @strudel/hydra
```

Then add the import to your evalScope:

```js
import { evalScope } from '@strudel.cycles/core';

evalScope(
  import('@strudel/hydra')
)
```
