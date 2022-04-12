# @strudel.cycles/core

This package contains the bare essence of strudel.

## Install

```sh
npm i @strudel.cycles/core --save
```

## Example

```js
import { sequence, State, TimeSpan } from '@strudel.cycles/core';

const pattern = sequence('a', ['b', 'c']);

const events = pattern.queryArc(0, 1);

const spans = events.map(
  (event) => `${event.value}: ${event.whole.begin.toFraction()} - ${event.whole.end.toFraction()} `,
);
```

yields:

```log
a: 0 - 1/2
b: 1/2 - 3/4
c: 3/4 - 1
a: 1 - 3/2
b: 3/2 - 7/4
c: 7/4 - 2
```

- [play with @strudel.cycles/core on codesandbox](https://codesandbox.io/s/strudel-core-test-qmz6qr?file=/src/index.js).
- [open color pattern example](https://raw.githack.com/tidalcycles/strudel/package-examples/packages/core/examples/canvas.html)
- [open minimal repl example](https://raw.githack.com/tidalcycles/strudel/package-examples/packages/core/examples/metro.html)
