# @strudel.cycles/tone

This package adds Tone.js functions to strudel Patterns.

## Install

```sh
npm i @strudel.cycles/tone --save
```

## Example

The following example will create a pattern and play it back with tone.js:

```js
import { sequence, stack, State, TimeSpan } from '@strudel.cycles/core';
import { Tone, polysynth, osc, out } from '@strudel.cycles/tone';

const pattern = sequence('c3', ['eb3', stack('g3', 'bb3')]).tone(polysynth().set(osc('sawtooth4')).chain(out()));

document.getElementById('play').addEventListener('click', async () => {
  await Tone.start();
  Tone.getTransport().stop();
  const events = pattern.query(new State(new TimeSpan(0, 4))).filter((e) => e.whole.begin.equals(e.part.begin));
  events.forEach((event) =>
    Tone.getTransport().schedule((time) => event.context.onTrigger(time, event), event.whole.begin.valueOf()),
  );
  Tone.getTransport().start('+0.1');
});
```

[open in codesandbox](https://codesandbox.io/s/strudel-tone-example-5ph2te?file=/src/index.js:0-708)

## API

See "Tone API" in the [Strudel Tutorial](https://strudel.tidalcycles.org/tutorial/)

## Dev Notes

- `@tonejs/piano` has peer dependency on `webmidi@^2.5.1`! A newer version of webmidi will break.
- If you use Tone in another package, make sure to `import { Tone } from '@strudel.cycles/tone`, to ensure you get the same AudioContext.
