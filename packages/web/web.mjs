export * from '@strudel.cycles/core';
export * from '@strudel.cycles/webaudio';
//export * from '@strudel.cycles/soundfonts';
export * from '@strudel.cycles/transpiler';
export * from '@strudel.cycles/mini';
export * from '@strudel.cycles/tonal';
export * from '@strudel.cycles/webaudio';
import { Pattern, evalScope, controls } from '@strudel.cycles/core';
import { initAudioOnFirstClick, registerSynthSounds, webaudioScheduler } from '@strudel.cycles/webaudio';
// import { registerSoundfonts } from '@strudel.cycles/soundfonts';
import { evaluate as _evaluate } from '@strudel.cycles/transpiler';
import { miniAllStrings } from '@strudel.cycles/mini';

// init logic
export async function defaultPrebake() {
  const loadModules = evalScope(
    evalScope,
    controls,
    import('@strudel.cycles/core'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/webaudio'),
    { hush, evaluate },
  );
  await Promise.all([loadModules, registerSynthSounds() /* , registerSoundfonts() */]);
}

// when this function finishes, everything is initialized
let initDone;

let scheduler;
export async function initStrudel(options = {}) {
  initAudioOnFirstClick();
  miniAllStrings();
  const { prebake, ...schedulerOptions } = options;

  initDone = (async () => {
    await defaultPrebake();
    await prebake?.();
  })();
  scheduler = webaudioScheduler(schedulerOptions);
  await initDone;
  return { scheduler };
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
