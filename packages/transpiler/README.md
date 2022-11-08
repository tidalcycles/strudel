# @strudel.cycles/transpiler

This package contains a JS code transpiler with the following features:

- add locations of mini notation strings (double quoted or backticked) for highlighting
- converts pseudo note variables to note strings
- adds return statement to the last expression

The transpiler is written with [acorn](https://github.com/acornjs/acorn) and aims to replace the `@strudel.cycles/eval` package, which uses [shift-ast](https://www.npmjs.com/package/shift-ast).

## Install

```sh
npm i @strudel.cycles/transpiler
```

## Use

```js
import { transpiler } from '@strudel.cycles/core';
import { evaluate } from '@strudel.cycles/core';

transpiler('note("c3 [e3,g3]")', { wrapAsync: false, addReturn: false, simpleLocs: true });
/* mini('c3 [e3,g3]').withMiniLocation(7,17) */

evaluate(note('c3 [e3,g3]'), transpiler); // returns pattern of above code
```
