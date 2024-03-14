# superdough

superdough is a simple web audio sampler and synth, intended for live coding.
It is the default output of [strudel](https://strudel.cc/).
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
  samples('github:tidalcycles/dirt-samples'),
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

[Open this in Codesandbox](https://codesandbox.io/s/superdough-demo-forked-sf8djh?file=/src/index.js)

## API

### superdough(value, deadline, duration)

```js
superdough({ s: 'bd', delay: 0.5 }, 0, 1);
```

- `value`: the sound properties:
  - `s`: the name of the sound as loaded via `samples` or `registerSound`
  - `n`: selects sample with given index
  - `bank`: prefix_ that is attached to the sound, e.g. `{ s: 'bd', bank: 'RolandTR909' }` = `{ s: 'RolandTR909_bd' }`
  - `gain`: gain from 0 to 1 (higher values also work but might clip)
  - `velocity`: additional gain multiplier
  - `cutoff`: low pass filter cutoff
  - `resonance`: low pass filter resonance
  - `hcutoff`: high pass filter cutoff
  - `hresonance`: high pass filter resonance
  - `bandf`: band pass filter cutoff
  - `bandq`: band pass  filter resonance
  - `crush`: amplitude bit crusher using given number of bits
  - `distort`: distortion effect. might get loud!
  - `pan`: stereo panning from 0 (left) to 1 (right)
  - `phaser`: sets the speed of the modulation
  - `phaserdepth`: the amount the signal is affected by the phaser effect.
  - `phasersweep`: the frequency sweep range of the lfo for the phaser effect.
  - `phasercenter`: the amount the signal is affected by the phaser effect.
  - `vowel`: vowel filter. possible values: "a", "e", "i", "o", "u"
  - `delay`: delay mix
  - `delayfeedback`: delay feedback
  - `delaytime`: delay time
  - `room`: reverb mix
  - `size`: reverb room size
  - `orbit`: bus name for global effects `delay` and `room`. same orbits will get the same effects
  - `freq`: repitches sound to given frequency in Hz
  - `note`: repitches sound to given note or midi number
  - `cut`: sets cut group. Sounds of same group will cut each other off
  - `clip`: multiplies duration with given number
  - `speed`: repitches sound by given factor
  - `begin`: moves beginning of sample to given factor (between 0 and 1)
  - `end`: moves end of sample to given factor (between 0 and 1)
  - `attack`: seconds of attack phase
  - `decay`: seconds of decay phase
  - `sustain`: gain of sustain phase
  - `release`: seconds of release phase
- `deadline`: seconds until the sound should play (0 = immediate)
- `duration`: seconds the sound should last. optional for one shot samples, required for synth sounds

### registerSynthSounds()

Loads the default waveforms `sawtooth`, `square`, `triangle` and `sine`. Use them like this:

```js
superdough({ s:'sawtooth' }, 0, 1)
```

The duration needs to be set for these sounds!

### samples(sampleMap)

allows you to load samples from URLs. There are 3 ways to load samples

1. sample map object
2. url of sample map json file
3. github repo

#### sample map object

You can pass a sample map like this:

```js
samples({
  '_base': 'https://raw.githubusercontent.com/felixroos/samples/main/',
  'bd': 'president/president_bd.mp3',
  'sd': ['president/president_sd.mp3', 'president/president_sd2.mp3'],
  'hh': ['president/president_hh.mp3'],
})
```

The `_base` property defines the root url while the others declare one or more sample paths for each sound.

For example the full URL for `bd` would then be `https://raw.githubusercontent.com/felixroos/samples/main/president/president_bd.mp3`

A loaded sound can then be played with `superdough({ s: 'bd' }, 0)`.

If you declare multiple sounds, you can select them with `n`: `superdough({ s: 'sd', n: 1 }, 0)`

The duration property is not needed for samples.

#### loading samples from a json file

Instead of passing an object as a sample map, you can also pass a URL to a json that contains a sample map:

```js
samples('https://raw.githubusercontent.com/felixroos/samples/main/strudel.json')
```

The json file is expected to have the same format as described above.

#### loading samples from a github repo

Because it is common to use github for samples, there is a short way to load a sample map from github:

```js
samples('github:tidalcycles/dirt-samples')
```

The format is `github:<user>/<repo>/<branch>`.

It expects a `strudel.json` file to be present at the root of the given repository, which declares the sample paths in the repo.

The format is also expected to be the same as explained above.

### initAudioOnFirstClick()

Initializes audio and makes sure it is playable after the first click in the document. A click is needed because of the [Autoplay Policy](https://www.w3.org/TR/autoplay-detection/).
You can call this function when the document loads.
Then just make sure your first call of `superdough` happens after a click of something.

## Credits

- [ZZFX](https://github.com/KilledByAPixel/ZzFX) used for synths starting with z
- [SuperDirt](https://github.com/musikinformatik/SuperDirt)
- [WebDirt](https://github.com/dktr0/WebDirt)
