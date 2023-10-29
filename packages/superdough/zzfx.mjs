//import { ZZFX } from 'zzfx';
import { midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext } from './superdough.mjs';
import { buildSamples } from './zzfx_fork.mjs';

export const getZZFX = (value, t) => {
  let {
    s,
    note = 36,
    freq,
    //
    zrand = 0,
    attack = 0,
    decay = 0,
    sustain = 0.8,
    release = 0.1,
    curve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    lfo = 0,
    znoise = 0,
    zmod = 0,
    zcrush = 0,
    zdelay = 0,
    tremolo = 0,
    duration = 0.2,
    zzfx,
  } = value;
  const sustainTime = Math.max(duration - attack - decay, 0);
  if (typeof note === 'string') {
    note = noteToMidi(note); // e.g. c3 => 48
  }
  // get frequency
  if (!freq && typeof note === 'number') {
    freq = midiToFreq(note);
  }
  s = s.replace('z_', '');
  const shape = ['sine', 'triangle', 'sawtooth', 'tan', 'noise'].indexOf(s) || 0;
  curve = s === 'square' ? 0 : curve;

  const params = zzfx || [
    0.25, // volume
    zrand,
    freq,
    attack,
    sustainTime,
    release,
    shape,
    curve,
    slide,
    deltaSlide,
    pitchJump,
    pitchJumpTime,
    lfo,
    znoise,
    zmod,
    zcrush,
    zdelay,
    sustain, // sustain volume!
    decay,
    tremolo,
  ];
  // console.log(redableZZFX(params));

  const samples = /* ZZFX. */ buildSamples(...params);
  const context = getAudioContext();
  const buffer = context.createBuffer(1, samples.length, context.sampleRate);
  buffer.getChannelData(0).set(samples);
  const source = getAudioContext().createBufferSource();
  source.buffer = buffer;
  source.start(t);
  return {
    node: source,
  };
};

export function registerZZFXSounds() {
  ['zzfx', 'z_sine', 'z_sawtooth', 'z_triangle', 'z_square', 'z_tan', 'z_noise'].forEach((wave) => {
    registerSound(
      wave,
      (t, value, onended) => {
        const { node: o } = getZZFX({ s: wave, ...value }, t);
        o.onended = () => {
          o.disconnect();
          onended();
        };
        return {
          node: o,
          stop: () => {},
        };
      },
      { type: 'synth', prebake: true },
    );
  });
}

// just for debugging
function redableZZFX(params) {
  const paramOrder = [
    'volume',
    'zrand',
    'frequency',
    'attack',
    'sustain',
    'release',
    'shape',
    'curve',
    'slide',
    'deltaSlide',
    'pitchJump',
    'pitchJumpTime',
    'lfo',
    'noise',
    'zmod',
    'zcrush',
    'zdelay',
    'sustainVolume',
    'decay',
    'tremolo',
  ];
  return Object.fromEntries(paramOrder.map((param, i) => [param, params[i]]));
}
