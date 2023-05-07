export * from '@strudel.cycles/core';
export * from '@strudel.cycles/webaudio';
export * from '@strudel.cycles/soundfonts';
export * from '@strudel.cycles/transpiler';
export * from '@strudel.cycles/mini';
export * from '@strudel.cycles/tonal';
export * from '@strudel.cycles/webaudio';
import { repl as _repl, evalScope, controls } from '@strudel.cycles/core';
import { initAudioOnFirstClick, getAudioContext, registerSynthSounds, webaudioOutput } from '@strudel.cycles/webaudio';
import { registerSoundfonts } from '@strudel.cycles/soundfonts';
import { transpiler } from '@strudel.cycles/transpiler';

async function prebake(userPrebake) {
  const loadModules = evalScope(
    evalScope,
    controls,
    import('@strudel.cycles/core'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/webaudio'),
  );
  await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts(), userPrebake?.()]);
}

export function repl(options = {}) {
  const prebaked = prebake(options?.prebake);
  initAudioOnFirstClick();
  return _repl({
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    ...options,
    beforeEval: async (args) => {
      options?.beforeEval?.(args);
      await prebaked;
    },
  });
}
