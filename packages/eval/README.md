# @strudel.cycles/eval

This package contains the strudel code transformer and evaluator.
It allows creating strudel patterns from input code that is optimized for minimal keystrokes and human readability.

## Install

```sh
npm i @strudel.cycles/eval --save
```

## Example

TODO: -extend +evalScope

```js
import { evaluate, extend } from '@strudel.cycles/eval';
import * as strudel from '@strudel.cycles/core';

extend(strudel); // add strudel to eval scope

async function run(code) {
  const { pattern } = await evaluate(code);
  const events = pattern.firstCycle();
  console.log(events.map((e) => e.show()).join('\n'));
}

run('sequence([a3, [b3, c4]])');
```

yields:

```js
(0/1 -> 1/2, 0/1 -> 1/2, a3)
(1/2 -> 3/4, 1/2 -> 3/4, b3)
(3/4 -> 1/1, 3/4 -> 1/1, c4)
```

[play with @strudel.cycles/eval on codesandbox](https://codesandbox.io/s/strudel-eval-example-ndz1d8?file=/src/index.js)

## Dev Notes

shift-traverser is currently monkey patched because its package.json uses estraverse@^4.2.0,
which does not support the spread operator (Error: Unknown node type SpreadProperty.).
By monkey patched, I mean I copied the source of shift-traverser to a subfolder and installed the dependencies (shift-spec + estraverse@^5.3.0)
