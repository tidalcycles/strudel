import { Pattern, toMidi } from '@strudel.cycles/core';
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
}

samples({
  jazzbass: {
    _base: './samples/jazzbass/moog_',
    c2: 'c2.mp3',
    e2: 'e2.mp3',
    a2: 'a2.mp3',
    c3: 'c3.mp3',
    e3: 'e3.mp3',
    a3: 'a3.mp3',
    c4: 'c4.mp3',
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

const maxPan = toMidi('C8');
const panwidth = (pan, width) => pan * width + (1 - width) / 2;

Pattern.prototype.panByPitch = function () {
  return this.fmap((value) => {
    // pan by pitch
    const pan = panwidth(Math.min(toMidi(value.note || value.n) / maxPan, 1), 0.5);
    return { ...value, pan: (value.pan || 1) * pan };
  });
};

Pattern.prototype.piano = function () {
  return this.clip(1).s('piano').panByPitch();
};

Pattern.prototype.rhodes = function () {
  return this.clip(1).s('stage73').panByPitch().gain(1.5);
};

Pattern.prototype.jazzbass = function () {
  return this.clip(1).s('jazzbass');
};

/*
stack(
  s("<bd [bd ~ bd]> ~, ~, hh*6")
  .speed(.8)
  //.cutoff(2000)
  .slow(2)
  //.cutoff(perlin.range(500,4000))
  .sometimes(x=>x.echo("2", 1/6+0.05, .8))
  ,
  note(
    "C^7 <Dm7 [F^7 [Fm7 Db^7]]>"
    //.euclidLegato(6,12)
    .voicings()
  )
  .rhodes()
  //.s('sawtooth')
  .slow(8).gain(2)
  .cutoff(2000)
  ,
  note(
    "[c2 <e2 g1>](5,12)".slow(4)
    .transpose(12)
    //.superimpose(add("<12 24>,0.05"))
  )
  .s("jazzbass").clip(1).gain(1)
  //.cutoff(sine.range(300,500).slow(4))
  //.resonance(10)
  ,
  note(
    "0 2 4 0".iter(4).add("<0>")
    //.off(1/12, add("7"))
    .off(1/6, add("14"))
    .degradeBy(.2)
    .scale('C5 major')
    .legato(4)
    .slow(2)
    .echo(2, 1/6, .5)
  )
  .piano()
  //.s('sawtooth')
  //.cutoff(1000)
  //.resonance(25)
  .gain(.5)
)
  //.hcutoff(1000)
  //.resonance(20)
  .reset("<x@3>")
  
.out()


*/

/*
note("[c2(3,8) [<eb2 g1> bb1]]")
  .s('sawtooth')
  .gain(.5)
  .cutoff(sine.range(200,1200).slow(4))
  .slow(2)
  .stack(
    note("Cm7@3 <Dm7 B7>".voicings().slow(4)).rhodes(),
    note("0 2 4 <9 8>".iter(4).scale('C5 minor'))
    .degradeBy(.5).echo(4, 1/8, .8)
    .legato(.05)
    .rhodes()
    .jux(rev),
  )
  .stack(s("bd,~ sd,hh*4").cutoff(2000))
  .reset("<x@3 x(3,8)>")
  .out()
  .logValues()
  */
