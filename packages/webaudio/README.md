# @strudel.cycles/webaudio

This package contains a scheduler + a clockworker and synths based on the Web Audio API.
It's an alternative to `@strudel.cycles/tone`, with better performance, but less features.

## Install

```sh
npm i @strudel.cycles/webaudio --save
```

## Example

```js
import { Scheduler, getAudioContext } from '@strudel.cycles/webaudio';

const scheduler = new Scheduler({
    audioContext: getAudioContext(),
    interval: 0.1,
    onEvent: (e) => e.context?.createAudioNode?.(e),
  });
const pattern = sequence([55, 99], 110).osc('sawtooth').out()
scheduler.setPattern(pattern);
scheduler.start()
//scheduler.stop()
```

A more sophisticated example can be found in [examples/repl.html](./examples/repl.html).
You can run it inside this directory with `npm run example`.

