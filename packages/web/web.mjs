export * from '@strudel/core';
export * from '@strudel/webaudio';
//export * from '@strudel/soundfonts';
export * from '@strudel/transpiler';
export * from '@strudel/mini';
export * from '@strudel/tonal';
export * from '@strudel/webaudio';
import { Pattern, evalScope, controls } from '@strudel/core';
import { initAudioOnFirstClick, registerSynthSounds, webaudioScheduler } from '@strudel/webaudio';
// import { registerSoundfonts } from '@strudel/soundfonts';
import { evaluate as _evaluate } from '@strudel/transpiler';
import { miniAllStrings } from '@strudel/mini';

// init logic
export async function defaultPrebake() {
  const loadModules = evalScope(
    evalScope,
    controls,
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

let scheduler;
export function initStrudel(options = {}) {
  initAudioOnFirstClick();
  miniAllStrings();
  const { prebake, ...schedulerOptions } = options;

  initDone = (async () => {
    await defaultPrebake();
    await prebake?.();
  })();
  scheduler = webaudioScheduler(schedulerOptions);
}

window.initStrudel = initStrudel;

// this method will play the pattern on the default scheduler
Pattern.prototype.play = function () {
  if (!scheduler) {
    throw new Error('.play: no scheduler found. Have you called init?');
  }
  initDone.then(() => {
    scheduler.setPattern(this, true);
  });
  return this;
};

// stop playback
export function hush() {
  scheduler.stop();
}

// evaluate and play the given code using the transpiler
export async function evaluate(code, autoplay = true) {
  const { pattern } = await _evaluate(code);
  autoplay && pattern.play();
}
