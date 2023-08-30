import { ZZFX } from 'zzfx';

export const getZZFX = (value, t, duration) => {
  let {
    s,
    note = 36,
    freq,
    //
    randomness = 0,
    attack = 0,
    decay = 0,
    sustain = 0.8,
    release = 0.1,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    tremolo = 0,
  } = value;
  if (typeof note === 'string') {
    note = noteToMidi(note); // e.g. c3 => 48
  }
  // get frequency
  if (!freq && typeof n === 'number') {
    freq = midiToFreq(n);
  }
  const shape = ['zsine', 'ztri', 'zsaw', 'ztan', 'znoise'].indexOf(s) || 0;

  const params = [
    1, // volume
    randomness, // randomness
    freq,
    attack,
    duration, // sustain time
    release,
    shape,
    shapeCurve,
    slide,
    deltaSlide,
    pitchJump,
    pitchJumpTime,
    repeatTime,
    noise,
    modulation,
    bitCrush,
    delay,
    sustain, // sustain volume!
    decay,
    tremolo,
  ];
  const paramOrder = [
    'volume',
    'randomness',
    'frequency',
    'attack',
    'sustain',
    'release',
    'shape',
    'shapeCurve',
    'slide',
    'deltaSlide',
    'pitchJump',
    'pitchJumpTime',
    'repeatTime',
    'noise',
    'modulation',
    'bitCrush',
    'delay',
    'sustainVolume',
    'decay',
    'tremolo',
  ];

  const readableParams = Object.fromEntries(paramOrder.map((param, i) => [param, params[i]]));
  console.log(readableParams);

  const samples = ZZFX.buildSamples(...params);
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
  ['zsine', 'zsaw', 'ztri', 'ztan', 'znoise'].forEach((wave) => {
    registerSound(wave, (t, value, onended) => {
      const duration = 0.2;
      const { node: o } = getZZFX({ s: wave, ...value }, t, duration);
      o.onended = () => {
        o.disconnect();
        onended();
      };
      return {
        node: o,
        stop: () => {},
      };
    });
  });
}
