import strudel from '@strudel.cycles/core';
const { Pattern } = strudel;

import { loadSoundfont as _loadSoundfont, startPresetNote } from 'sfumato';

Pattern.prototype.soundfont = function (sf, n = 0) {
  return this.onTrigger((t, h, ct) => {
    const ctx = getAudioContext();
    const note = getPlayableNoteValue(h);
    const preset = sf.presets[n % sf.presets.length];
    const deadline = ctx.currentTime + t - ct;
    const args = [ctx, preset, toMidi(note), deadline];
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
  return sf;
}
