import { Pattern, silence, toMidi } from '@strudel.cycles/core';
import { samples } from '@strudel.cycles/webaudio';

export function prebake() {
  samples(
    {
      piano: {
        A0: 'A0v8.mp3',
        C1: 'C1v8.mp3',
        Ds1: 'Ds1v8.mp3',
        Fs1: 'Fs1v8.mp3',
        A1: 'A1v8.mp3',
        C2: 'C2v8.mp3',
        Ds2: 'Ds2v8.mp3',
        Fs2: 'Fs2v8.mp3',
        A2: 'A2v8.mp3',
        C3: 'C3v8.mp3',
        Ds3: 'Ds3v8.mp3',
        Fs3: 'Fs3v8.mp3',
        A3: 'A3v8.mp3',
        C4: 'C4v8.mp3',
        Ds4: 'Ds4v8.mp3',
        Fs4: 'Fs4v8.mp3',
        A4: 'A4v8.mp3',
        C5: 'C5v8.mp3',
        Ds4: 'Ds4v8.mp3',
        Fs5: 'Fs5v8.mp3',
        A5: 'A5v8.mp3',
        C6: 'C6v8.mp3',
        Ds6: 'Ds6v8.mp3',
        Fs6: 'Fs6v8.mp3',
        A6: 'A6v8.mp3',
        C7: 'C7v8.mp3',
        Ds7: 'Ds7v8.mp3',
        Fs7: 'Fs7v8.mp3',
        A7: 'A7v8.mp3',
        C8: 'C8v8.mp3',
      },
    },
    // https://archive.org/details/SalamanderGrandPianoV3
    // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
    './samples/piano/',
  );
  fetch('EmuSP12.json')
    .then(res => res.json())
    .then(json => samples(json, './EmuSP12/'));
}

samples({
  jazzbass: {
    _base: './samples/jazzbass/moog_',
    c1: 'c2.mp3',
    e1: 'e2.mp3',
    a1: 'a2.mp3',
    c2: 'c3.mp3',
    e2: 'e3.mp3',
    a2: 'a3.mp3',
    c3: 'c4.mp3',
  },
  stage73: {
    _base: './samples/stage73/',
    c2: ['quiet/c2.mp3', 'loud/c2.mp3'],
    e2: ['quiet/e2.mp3', 'loud/e2.mp3'],
    a2: ['quiet/a2.mp3', 'loud/a2.mp3'],
    c3: ['quiet/c3.mp3', 'loud/c3.mp3'],
    e3: ['quiet/e3.mp3', 'loud/e3.mp3'],
    a3: ['quiet/a3.mp3', 'loud/a3.mp3'],
    c4: ['quiet/c4.mp3', 'loud/c4.mp3'],
    e4: ['quiet/e4.mp3', 'loud/e4.mp3'],
    a4: ['quiet/a4.mp3', 'loud/a4.mp3'],
    c5: ['quiet/c5.mp3', 'loud/c5.mp3'],
    e5: ['quiet/e5.mp3', 'loud/e5.mp3'],
    a5: ['quiet/a5.mp3', 'loud/a5.mp3'],
    c6: ['quiet/c6.mp3', 'loud/c6.mp3'],
  },
  flute: {
    _base: './samples/flute/',
    g2: 'g2.mp3',
    c3: 'c3.mp3',
    f3: 'f3.mp3',
    c4: 'c4.mp3',
    f4: 'f4.mp3',
    c5: 'c5.mp3',
  },
});
console.log('bake...');
samples(
  {
    bd: 'bd.mp3',
    sd: ['sd.mp3', 'sd2.mp3'],
    hh: ['hh.mp3'],
    snap: ['snap.mp3'],
    oh: ['oh.mp3'],
  },
  './samples/president/president_',
);

const times = (length, func) => Array.from({ length }, (_, i) => func(i));

samples({ earth: times((i) => `Earth Kit (${i + 1}).wav`) }, './samples/EMU World/Earth Kit/');
samples({ bottle: times((i) => `Bottle (${i + 1}).wav`) }, './samples/EMU World/Bottle/');
samples({ shekere: times(32, (i) => `Shekere (${i + 1}).wav`) }, './samples/EMU World/Shekere/');
samples({ block: times(5, (i) => `Block (${i + 1}).wav`) }, './samples/EMU World/Block/');

samples(
  {
    'Brazilian Kit': [
      'BK Agogo 2.wav',
      'BK Agogo 3.wav',
      'BK Agogo.wav',
      'BK Bass Drum.wav',
      'BK Bass Tom.wav',
      'BK Block 2.wav',
      'BK Block 3.wav',
      'BK Block.wav',
      'BK ClapTamb 2.wav',
      'BK ClapTamb.wav',
      'BK Conga 2.wav',
      'BK Conga.wav',
      'BK Cowbell 2.wav',
      'BK Cowbell 3.wav',
      'BK Cowbell.wav',
      'BK CrashTamb.wav',
      'BK Cup 2.wav',
      'BK Cup.wav',
      'BK Cymb 2.wav',
      'BK Cymb 3.wav',
      'BK Cymbal.wav',
      'BK High Tom 2.wav',
      'BK High Tom.wav',
      'BK Low Tom 2.wav',
      'BK Low Tom.wav',
      'BK Mid Tom 2.wav',
      'BK Mid Tom.wav',
      'BK Mute Cymb.wav',
      'BK Rattle.wav',
      'BK Ride 2.wav',
      'BK Ride.wav',
      'BK Rimshot.wav',
      'BK Scraper 2.wav',
      'BK Scraper.wav',
      'BK Shaker 2.wav',
      'BK Shaker 3.wav',
      'BK Shaker.wav',
      'BK Snare.wav',
      'BK SnareTamb 2.wav',
      'BK SnareTamb.wav',
      'BK Triangle 2.wav',
      'BK Triangle 3.wav',
      'BK Triangle 4.wav',
      'BK Triangle 5.wav',
      'BK Triangle 6.wav',
      'BK Triangle.wav',
      'BK Whistle 2.wav',
      'BK Whistle 3.wav',
      'BK Whistle.wav',
      'BK Woop 2.wav',
      'BK Woop.wav',
    ],
  },
  './samples/EMU World/Brazilian Kit/',
);

const maxPan = toMidi('C8');
const panwidth = (pan, width) => pan * width + (1 - width) / 2;

Pattern.prototype.panByPitch = function () {
  return this.fmap((value) => {
    try {
      // pan by pitch
      const pan = panwidth(Math.min(toMidi(value.note || value.n) / maxPan, 1), 0.5);
      return { ...value, pan: (value.pan || 1) * pan };
    } catch (e) {
      console.log('.panByPitch error', e);
      return silence;
    }
  });
};

Pattern.prototype.piano = function () {
  return this.clip(1).s('piano').panByPitch().gain(0.6);
};

Pattern.prototype.rhodes = function () {
  return this.clip(1).s('stage73').panByPitch(); //.gain(1.5);
};

Pattern.prototype.jazzbass = function () {
  return this.clip(1).s('jazzbass').gain(0.6);
};
Pattern.prototype.flute = function () {
  return this.clip(1).s('flute');
};
Pattern.prototype.block = function () {
  return this.clip(1).s('block');
};
