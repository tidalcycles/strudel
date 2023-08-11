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
import { superdough, samples } from 'superdough';
// load samples from github
const loadSamples = samples('github:tidalcycles/Dirt-Samples/master');

// play some sounds when a button is clicked 
document.getElementById('play').addEventListener('click', () => {
  superdough({ s: "bd", delay: .5 }, 0);
  superdough({ s: "sawtooth", cutoff: 600, resonance: 8 }, 0);
  superdough({ s: "hh" }, 0.25);
  superdough({ s: "sd", room: .5 }, 0.5);
  superdough({ s: "hh" }, 0.75);
})
```

## Credits

- [SuperDirt](https://github.com/musikinformatik/SuperDirt)
- [WebDirt](https://github.com/dktr0/WebDirt)