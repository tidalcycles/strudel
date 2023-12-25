import { controls, noteToMidi, valueToMidi, Pattern, evalScope } from '@strudel.cycles/core';
import { registerSynthSounds, registerZZFXSounds, samples } from '@strudel.cycles/webaudio';
import * as core from '@strudel.cycles/core';

export async function prebake() {
  const modulesLoading = evalScope(
    // import('@strudel.cycles/core'),
    core,
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/webaudio'),
    import('@strudel/codemirror'),
    import('@strudel/hydra'),
    import('@strudel.cycles/soundfonts'),
    import('@strudel.cycles/midi'),
    // import('@strudel.cycles/xen'),
    // import('@strudel.cycles/serial'),
    // import('@strudel.cycles/csound'),
    // import('@strudel.cycles/osc'),
    controls, // sadly, this cannot be exported from core directly (yet)
  );
  // load samples
  const ds = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/';
  await Promise.all([
    modulesLoading,
    registerSynthSounds(),
    registerZZFXSounds(),
    //registerSoundfonts(),
    // need dynamic import here, because importing @strudel.cycles/soundfonts fails on server:
    // => getting "window is not defined", as soon as "@strudel.cycles/soundfonts" is imported statically
    // seems to be a problem with soundfont2
    import('@strudel.cycles/soundfonts').then(({ registerSoundfonts }) => registerSoundfonts()),
    samples(`${ds}/tidal-drum-machines.json`),
    samples(`${ds}/piano.json`),
    samples(`${ds}/Dirt-Samples.json`),
    samples(`${ds}/EmuSP12.json`),
    samples(`${ds}/vcsl.json`),
  ]);
}

const maxPan = noteToMidi('C8');
const panwidth = (pan, width) => pan * width + (1 - width) / 2;

Pattern.prototype.piano = function () {
  return this.fmap((v) => ({ ...v, clip: v.clip ?? 1 })) // set clip if not already set..
    .s('piano')
    .release(0.1)
    .fmap((value) => {
      const midi = valueToMidi(value);
      // pan by pitch
      const pan = panwidth(Math.min(Math.round(midi) / maxPan, 1), 0.5);
      return { ...value, pan: (value.pan || 1) * pan };
    });
};
