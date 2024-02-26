# @strudel/mini

This package contains the mini notation parser and pattern generator.

## Install

```sh
npm i @strudel/mini --save
```

## Example

```js
import { mini } from '@strudel/mini';

const pattern = mini('a [b c*2]');

const events = pattern.firstCycle().map((e) => e.show());
console.log(events);
```

yields:

```log
(0/1 -> 1/2, 0/1 -> 1/2, a)
(1/2 -> 3/4, 1/2 -> 3/4, b)
(3/4 -> 7/8, 3/4 -> 7/8, c)
(7/8 -> 1/1, 7/8 -> 1/1, c)
```

[Play with @strudel/mini codesandbox](https://codesandbox.io/s/strudel-mini-example-oe9wcu?file=/src/index.js)

## Mini Notation API

See "Mini Notation" in the [Strudel Tutorial](https://strudel.cc/learn/mini-notation)

## Building the Parser

The parser [krill-parser.js] is generated from [krill.pegjs](./krill.pegjs) using [peggy](https://peggyjs.org/).
To generate the parser, run

```js
npm run build:parser
```
