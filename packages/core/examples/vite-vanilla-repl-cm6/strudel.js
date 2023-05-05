import { getAudioContext, webaudioOutput, registerSynthSounds } from '@strudel.cycles/webaudio';

const ctx = getAudioContext();

export async function initStrudel(options = {}) {
  const [{ controls, repl, evalScope }, { registerSoundfonts }, { transpiler }] = await Promise.all([
    import('@strudel.cycles/core'),
    import('@strudel.cycles/soundfonts'),
    import('@strudel.cycles/transpiler'),
  ]);

  const loadModules = evalScope(
    controls,
    import('@strudel.cycles/core'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/webaudio'),
  );

  await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts()]);

  return repl({
    defaultOutput: webaudioOutput,
    getTime: () => ctx.currentTime,
    transpiler,
    ...options,
  });
}
