import { Invoke } from './utils.mjs';
import { duration, isNote, midiToFreq, noteToMidi, Pattern } from '@strudel.cycles/core';
import { getAudioContext } from '@strudel.cycles/webaudio';

export const desktopAudio = async (value, deadline, hapDuration) => {
  const ac = getAudioContext();
  if (typeof value !== 'object') {
    throw new Error(
      `expected hap.value to be an object, but got "${value}". Hint: append .note() or .s() to the end`,
      'error',
    );
  }

  let t = ac.currentTime + deadline;

  let {
    note = 'C3',
    s = 'triangle',
    bank = '',
    source,
    gain = 0.8,
    // low pass
    cutoff = 8000,
    resonance = 1,
    // high pass
    hcutoff = 0,
    hresonance = 1,
    // band pass
    bandf = 0,
    bandq = 1,
    //
    coarse,
    crush,
    shape,
    pan,
    vowel,
    delay = 0,
    delayfeedback = 0.5,
    delaytime = 0.25,
    orbit = 1,
    room,
    size = 2,
    velocity = 1,
    analyze, // analyser wet
    fft = 8, // fftSize 0 - 10
    speed = 1, // sample playback speed
    begin = 0,
    end = 1,
    loop = 0,
    loopBegin = 0,
    loopEnd = 1,
  } = value;

  console.log(value);
  value.duration = hapDuration;
  if (isNote(note)) {
    note = noteToMidi(note);
  }

  if (delay !== 0) {
    delay = Math.abs(delay);
    delayfeedback = Math.abs(delayfeedback);
    delaytime = Math.abs(delaytime);
  }

  const loop_packaged = [loop, loopBegin, loopEnd];
  const delay_packaged = [delay, delayfeedback, delaytime];

  const offset = (t - getAudioContext().currentTime) * 1000;
  const roundedOffset = Math.round(offset);
  const messagesfromjs = [];

  messagesfromjs.push({
    note: midiToFreq(note),
    offset: roundedOffset,
    waveform: s,
    bank: bank,
    cutoff: cutoff,
    resonance: resonance,
    hcutoff: hcutoff,
    hresonance: hresonance,
    bandf: bandf,
    bandq: bandq,
    duration: hapDuration,
    velocity: velocity,
    delay: delay_packaged,
    speed: speed,
    begin: begin,
    end: end,
    loop_packaged: loop_packaged,
  });

  if (messagesfromjs.length) {
    setTimeout(() => {
      Invoke('sendwebaudio', { messagesfromjs });
    });
  }
};
const hap2value = (hap) => {
  hap.ensureObjectValue();
  return { ...hap.value, velocity: hap.context.velocity };
};
export const webaudioDesktopOutputTrigger = (t, hap, ct, cps) =>
  desktopAudio(hap2value(hap), t - ct, hap.duration / cps, cps);
export const webaudioDesktopOutput = (hap, deadline, hapDuration) =>
  desktopAudio(hap2value(hap), deadline, hapDuration);

Pattern.prototype.webaudio = function () {
  return this.onTrigger(webaudioDesktopOutputTrigger);
};
