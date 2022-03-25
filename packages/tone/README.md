# @strudel/tone

This package adds Tone.js functions to strudel Patterns.

## Dev Notes

- `@tonejs/piano` has peer dependency on `webmidi@^2.5.1`! A newer version of webmidi will break.
- If you use Tone in another package, make sure to `import { Tone } from '@strudel/tone`, to ensure you get the same AudioContext.
