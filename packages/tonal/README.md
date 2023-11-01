# @strudel.cycles/tonal

This package adds tonal / harmonic functions to strudel Patterns.

## Install

```sh
npm i @strudel.cycles/tonal --save
```

## Example

```js
import { sequence } from '@strudel.cycles/core';
import '@strudel.cycles/tonal';

const pattern = sequence(0, [1, 2]).scale('C major');

const events = pattern.firstCycle().map((e) => e.show());
```

yields:

```js
(0/1 -> 1/2, 0/1 -> 1/2, C3)
(1/2 -> 3/4, 1/2 -> 3/4, D3)
(3/4 -> 1/1, 3/4 -> 1/1, E3)
```

[play with @strudel.cycles/tonal codesandbox](https://codesandbox.io/s/strudel-tonal-example-rgc5if?file=/src/index.js)

## Tonal API

See "Tonal API" in the [Strudel Tutorial](https://strudel.cc/learn/tonal)
