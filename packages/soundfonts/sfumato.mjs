import { Pattern } from '@strudel.cycles/core';
import { /* loadSoundfont, */ startPresetNote } from 'sfumato';

// TODO: find way to cache loadSoundfont

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
