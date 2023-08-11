# superdough

superdough is a simple web audio sampler and synth, intended for live coding.
It is the default output of [strudel](https://strudel.tidalcycles.org/).
This package has no ties to strudel and can be used to quickly bake your own music system on the web.

## Install

via npm:

```js
npm i superdough --save
```

## Use

```js
import { superdough, samples, initAudioOnFirstClick, registerSynthSounds } from 'superdough';

const init = Promise.all([
  initAudioOnFirstClick(),
  samples('github:tidalcycles/Dirt-Samples/master'),
  registerSynthSounds(),
]);

const loop = (t = 0) => {
  // superdough(value, time, duration)
  superdough({ s: 'bd', delay: 0.5 }, t);
  superdough({ note: 'g1', s: 'sawtooth', cutoff: 600, resonance: 8 }, t, 0.125);
  superdough({ note: 'g2', s: 'sawtooth', cutoff: 600, resonance: 8 }, t + 0.25, 0.125);
  superdough({ s: 'hh' }, t + 0.25);
  superdough({ s: 'sd', room: 0.5 }, t + 0.5);
  superdough({ s: 'hh' }, t + 0.75);
};

document.getElementById('play').addEventListener('click', async () => {
  await init;
  let t = 0.1;
  while (t < 16) {
    loop(t++);
  }
});
```

## Credits

- [SuperDirt](https://github.com/musikinformatik/SuperDirt)
- [WebDirt](https://github.com/dktr0/WebDirt)