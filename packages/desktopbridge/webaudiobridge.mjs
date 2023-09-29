import { Invoke } from './utils.mjs';
import { duration, isNote, midiToFreq, noteToMidi, Pattern, valueToMidi } from '@strudel.cycles/core';
import { getAudioContext, getEnvelope, getSound, logger } from '@strudel.cycles/webaudio';

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
    note = 'C2',
    s = 'triangle',
    bank,
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
    attack = 0.001,
    decay = 0.005,
    sustain = 1,
    release = 0.001,
    lpattack = 0.0001,
    lpdecay = 0.2,
    lpsustain = 0.6,
    lprelease = 0.2,
    lpenv = 0,
    hpattack = 0.0001,
    hpdecay = 0.2,
    hpsustain = 0.6,
    hprelease = 0.2,
    hpenv = 0,
    bpattack = 0.0001,
    bpdecay = 0.2,
    bpsustain = 0.6,
    bprelease = 0.2,
    bpenv = 0,
    n = 0,
    freq,
  } = value;

  if (bank && s) {
    s = `${bank}_${s}`;
  }
  if (freq !== undefined && note !== undefined) {
    logger('[sampler] hap has note and freq. ignoring note', 'warning');
  }
  let midi = valueToMidi({ freq, note }, 36);
  value.duration = hapDuration;
  let transpose;
  transpose = midi - 36;
  let sampleUrl;
  let baseUrl;
  if (s === 'sine' || s === 'square' || s === 'saw' || s === 'sawtooth' || s === 'triangle') {
    sampleUrl = 'none';
  } else {
    let path;
    if (getSound(s).data.baseUrl !== undefined) {
      baseUrl = getSound(s).data.baseUrl;
      if (baseUrl === './piano/') {
        path = 'https://strudel.tidalcycles.org/';
      } else if (baseUrl === './EmuSP12/') {
        path = 'https://strudel.tidalcycles.org/';
      } else {
        path = '';
      }
    }
    let map = getSound(s).data.samples;
    if (Array.isArray(map)) {
      sampleUrl =
          path !== undefined ? path + map[n % map.length].replace('./', '') : map[n % map.length].replace('./', '');
    } else {
      const midiDiff = (noteA) => noteToMidi(noteA) - midi;
      // object format will expect keys as notes
      const closest = Object.keys(map)
          .filter((k) => !k.startsWith('_'))
          .reduce(
              (closest, key, j) => (!closest || Math.abs(midiDiff(key)) < Math.abs(midiDiff(closest)) ? key : closest),
              null,
          );
      transpose = -midiDiff(closest); // semitones to repitch
      sampleUrl =
          path !== undefined
              ? path + map[closest][n % map[closest].length].replace('./', '')
              : map[closest][n % map[closest].length].replace('./', '');
    }
  }
  if (isNote(note)) {
    note = noteToMidi(note);
  }
  const playbackRate = 1.0 * Math.pow(2, transpose / 12);

  if (delay !== 0) {
    delay = Math.abs(delay);
    delayfeedback = Math.abs(delayfeedback);
    delaytime = Math.abs(delaytime);
  }

  let adsr_on = attack !== 0.001 || decay !== 0.05 || sustain !== 1 || release !== 0.01 ? 1 : 0;

  const packages = {
    loop: [loop, loopBegin, loopEnd],
    delay: [delay, delaytime, delayfeedback],
    lpf: [cutoff, resonance],
    hpf: [hcutoff, hresonance],
    bpf: [bandf, bandq],
    adsr: [attack, decay, sustain, release, adsr_on],
    lpenv: [lpattack, lpdecay, lpsustain, lprelease, lpenv],
    hpenv: [hpattack, hpdecay, hpsustain, hprelease, hpenv],
    bpenv: [bpattack, bpdecay, bpsustain, bprelease, bpenv],
  };

  const dirname = bank + '/' + s + '/';

  const offset = (t - getAudioContext().currentTime) * 1000;
  const roundedOffset = Math.round(offset);
  const messagesfromjs = [];
  messagesfromjs.push({
    note: midiToFreq(note),
    offset: roundedOffset,
    waveform: s,
    lpf: packages.lpf,
    hpf: packages.hpf,
    bpf: packages.bpf,
    duration: hapDuration,
    velocity: velocity,
    delay: packages.delay,
    orbit: orbit,
    speed: speed * playbackRate,
    begin: begin,
    end: end,
    looper: packages.loop,
    adsr: packages.adsr,
    lpenv: packages.lpenv,
    hpenv: packages.hpenv,
    bpenv: packages.bpenv,
    n: n,
    sampleurl: sampleUrl,
    dirname: dirname,
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
