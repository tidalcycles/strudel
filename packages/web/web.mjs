export * from '@strudel/core';
export * from '@strudel/webaudio';
//export * from '@strudel/soundfonts';
export * from '@strudel/transpiler';
export * from '@strudel/mini';
export * from '@strudel/tonal';
export * from '@strudel/webaudio';
import { Pattern, evalScope, setTime } from '@strudel/core';
import { initAudioOnFirstClick, registerSynthSounds, webaudioRepl } from '@strudel/webaudio';
// import { registerSoundfonts } from '@strudel/soundfonts';
import { evaluate as _evaluate, transpiler } from '@strudel/transpiler';
import { miniAllStrings } from '@strudel/mini';

// init logic
export async function defaultPrebake() {
  const loadModules = evalScope(
    evalScope,
    import('@strudel/core'),
    import('@strudel/mini'),
    import('@strudel/tonal'),
    import('@strudel/webaudio'),
    { hush, evaluate },
  );
  await Promise.all([loadModules, registerSynthSounds() /* , registerSoundfonts() */]);
}

// when this function finishes, everything is initialized
let initDone;

let repl;
export function initStrudel(options = {}) {
  initAudioOnFirstClick();
  options.miniAllStrings !== false && miniAllStrings();
  const { prebake, ...replOptions } = options;
  repl = webaudioRepl({ ...replOptions, transpiler });
  initDone = (async () => {
    await defaultPrebake();
    await prebake?.();
    return repl;
  })();
  setTime(() => repl.scheduler.now());
  return initDone;
}

window.initStrudel = initStrudel;

// this method will play the pattern on the default scheduler
Pattern.prototype.play = function () {
  if (!repl) {
    throw new Error('.play: no repl found. Have you called initStrudel?');
  }
  initDone.then(() => {
    repl.setPattern(this, true);
  });
  return this;
};

// stop playback
export function hush() {
  repl.stop();
}

// evaluate and play the given code using the transpiler
export async function evaluate(code, autoplay = true) {
  return repl.evaluate(code, autoplay);
}
