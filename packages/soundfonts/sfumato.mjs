import { Pattern, getPlayableNoteValue, noteToMidi } from '@strudel/core';
import { getAudioContext, registerSound } from '@strudel/webaudio';
import { loadSoundfont as _loadSoundfont, startPresetNote } from 'sfumato';

Pattern.prototype.soundfont = function (sf, n = 0) {
  return this.onTrigger((time_deprecate, h, ct, cps, targetTime) => {
    const ctx = getAudioContext();
    const note = getPlayableNoteValue(h);
    const preset = sf.presets[n % sf.presets.length];
    const deadline = targetTime;
    const args = [ctx, preset, noteToMidi(note), deadline];
    const stop = startPresetNote(...args);
    stop(deadline + h.duration);
  });
};

const soundfontCache = new Map();
export function loadSoundfont(url) {
  if (soundfontCache.get(url)) {
    return soundfontCache.get(url);
  }
  const sf = _loadSoundfont(url);
  soundfontCache.set(url, sf);
  /*sf.then((font) => {
    font.presets.forEach((preset) => {
      console.log('preset', preset.header.name);
      registerSound(
        preset.header.name.replaceAll(' ', '_'),
        (time, value, onended) => {
          const ctx = getAudioContext();
          let { note } = value; // freq ?

          const p = font.presets.find((p) => p.header.name === preset.header.name);

          if (!p) {
            throw new Error('preset not found');
          }
          const deadline = time; // - ctx.currentTime;
          const args = [ctx, p, noteToMidi(note), deadline];
          const stop = startPresetNote(...args);
          return { node: undefined, stop };
        },
        { type: 'soundfont' },
      );
    });
    //console.log('f', f);
  });*/
  return sf;
}
