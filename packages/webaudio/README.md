# @strudel.cycles/xen

This package adds xenharmonic / microtonal functions to strudel Patterns.

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
