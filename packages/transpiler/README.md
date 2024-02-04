# @strudel/transpiler

This package contains a JS code transpiler with the following features:

- add locations of mini notation strings (double quoted or backticked) for highlighting
- converts pseudo note variables to note strings
- adds return statement to the last expression

## Install

```sh
npm i @strudel/transpiler
```

## Use

```js
import { transpiler } from '@strudel/core';
import { evaluate } from '@strudel/core';

transpiler('note("c3 [e3,g3]")', { wrapAsync: false, addReturn: false, simpleLocs: true });
/* mini('c3 [e3,g3]').withMiniLocation(7,17) */

evaluate(note('c3 [e3,g3]'), transpiler); // returns pattern of above code
```
