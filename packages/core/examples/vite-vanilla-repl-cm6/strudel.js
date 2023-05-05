import { controls, repl, evalScope } from "@strudel.cycles/core";
import { transpiler } from "@strudel.cycles/transpiler";
import {
  getAudioContext,
  webaudioOutput,
  initAudioOnFirstClick,
  registerSynthSounds
} from "@strudel.cycles/webaudio";
import { registerSoundfonts } from "@strudel.cycles/soundfonts";

const initAudio = initAudioOnFirstClick();
const ctx = getAudioContext();

const loadModules = (scope = {}) =>
  evalScope(
    controls,
    import("@strudel.cycles/core"),
    import("@strudel.cycles/mini"),
    import("@strudel.cycles/tonal"),
    import("@strudel.cycles/webaudio"),
    scope
  );

export async function initStrudel(options = {}) {
  await Promise.all([
    initAudio,
    loadModules(),
    registerSynthSounds(),
    registerSoundfonts()
  ]);

  return repl({
    defaultOutput: webaudioOutput,
    getTime: () => ctx.currentTime,
    transpiler,
    ...options
  });
}
