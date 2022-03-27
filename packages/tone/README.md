# @strudel.cycles/tone

This package adds Tone.js functions to strudel Patterns.

## Install

```sh
npm i @strudel.cycles/tone --save
```

## Dev Notes

- `@tonejs/piano` has peer dependency on `webmidi@^2.5.1`! A newer version of webmidi will break.
- If you use Tone in another package, make sure to `import { Tone } from '@strudel.cycles/tone`, to ensure you get the same AudioContext.
