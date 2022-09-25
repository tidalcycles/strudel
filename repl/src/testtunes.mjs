export const timeCatMini = `stack(
  "c3@3 [eb3, g3, [c4 d4]/2]",
  "c2 g2",
  "[eb4@5 [f4 eb4 d4]@3] [eb4 c4]/2".slow(8)
)`;

export const timeCat = `stack(
  timeCat([3, c3], [1, stack(eb3, g3, seq(c4, d4).slow(2))]),
  seq(c2, g2),
  seq(
    timeCat([5, eb4], [3, seq(f4, eb4, d4)]), 
    seq(eb4, c4).slow(2)
  ).slow(4)
)`;

export const shapeShifted = `stack(
  seq(
    e5, [b4, c5], d5, [c5, b4],
    a4, [a4, c5], e5, [d5, c5],
    b4, [r, c5], d5, e5,
    c5, a4, a4, r,
    [r, d5], [r, f5], a5, [g5, f5],
    e5, [r, c5], e5, [d5, c5],
    b4, [b4, c5], d5, e5,
    c5, a4, a4, r,
  ).rev(),
  seq(
    e2, e3, e2, e3, e2, e3, e2, e3,
    a2, a3, a2, a3, a2, a3, a2, a3,
    gs2, gs3, gs2, gs3, e2, e3, e2, e3,
    a2, a3, a2, a3, a2, a3, b1, c2,
    d2, d3, d2, d3, d2, d3, d2, d3,
    c2, c3, c2, c3, c2, c3, c2, c3,
    b1, b2, b1, b2, e2, e3, e2, e3,
    a1, a2, a1, a2, a1, a2, a1, a2,
  ).rev()
).slow(16)`;

/* export const tetrisWithFunctions = `stack(seq(
  'e5', seq('b4', 'c5'), 'd5', seq('c5', 'b4'),
  'a4', seq('a4', 'c5'), 'e5', seq('d5', 'c5'),
  'b4', seq(r, 'c5'), 'd5', 'e5',
  'c5', 'a4', 'a4', r,
  seq(r, 'd5'), seq(r, 'f5'), 'a5', seq('g5', 'f5'),
  'e5', seq(r, 'c5'), 'e5', seq('d5', 'c5'),
  'b4', seq('b4', 'c5'), 'd5', 'e5',
  'c5', 'a4', 'a4', r),
  seq(
    'e2', 'e3', 'e2', 'e3', 'e2', 'e3', 'e2', 'e3',
    'a2', 'a3', 'a2', 'a3', 'a2', 'a3', 'a2', 'a3',
    'g#2', 'g#3', 'g#2', 'g#3', 'e2', 'e3', 'e2', 'e3',
    'a2', 'a3', 'a2', 'a3', 'a2', 'a3', 'b1', 'c2',
    'd2', 'd3', 'd2', 'd3', 'd2', 'd3', 'd2', 'd3',
    'c2', 'c3', 'c2', 'c3', 'c2', 'c3', 'c2', 'c3',
    'b1', 'b2', 'b1', 'b2', 'e2', 'e3', 'e2', 'e3',
    'a1', 'a2', 'a1', 'a2', 'a1', 'a2', 'a1', 'a2',
  )
).slow(16)`; */

/* export const tetris = `stack(
  seq(
    "e5 [b4 c5] d5 [c5 b4]",
    "a4 [a4 c5] e5 [d5 c5]",
    "b4 [~ c5] d5 e5",
    "c5 a4 a4 ~",
    "[~ d5] [~ f5] a5 [g5 f5]",
    "e5 [~ c5] e5 [d5 c5]",
    "b4 [b4 c5] d5 e5",
    "c5 a4 a4 ~"
  ),
  seq(
    "e2 e3 e2 e3 e2 e3 e2 e3",
    "a2 a3 a2 a3 a2 a3 a2 a3",
    "g#2 g#3 g#2 g#3 e2 e3 e2 e3",
    "a2 a3 a2 a3 a2 a3 b1 c2",
    "d2 d3 d2 d3 d2 d3 d2 d3",
    "c2 c3 c2 c3 c2 c3 c2 c3",
    "b1 b2 b1 b2 e2 e3 e2 e3",
    "a1 a2 a1 a2 a1 a2 a1 a2",
  )
).slow(16)`;
 */

export const whirlyStrudel = `seq(e4, [b2,  b3], c4)
.every(4, fast(2))
.every(3, slow(1.5))
.fast(cat(1.25, 1, 1.5))
.every(2, _ => seq(e4, r, e3, d4, r))`;

export const transposedChordsHacked = `stack(
  "c2 eb2 g2",
  "Cm7".voicings(['g2','c4']).slow(2)
).transpose(
  "<1 2 3 2>".slow(2)
).transpose(5)`;

export const scaleTranspose = `"f2,f3,c4,ab4"
.scale(seq('F minor', 'F harmonic minor').slow(4))
.scaleTranspose("<0 -1 -2 -3>")
.transpose("0 1".slow(16))`;

export const struct = `stack(
  "c2 g2 a2 [e2@2 eb2] d2 a2 g2 [d2 ~ db2]",
  "[C^7 A7] [Dm7 G7]".struct("[x@2 x] [~@2 x] [~ x@2]@2 [x ~@2] ~ [~@2 x@4]@2")
  .voicings(['G3','A4'])
).slow(4)`;

export const magicSofa = `stack(
  "<C^7 F^7 ~> <Dm7 G7 A7 ~>"
   .every(2, fast(2))
   .voicings(),
  "<c2 f2 g2> <d2 g2 a2 e2>"
).transpose("<0 2 3 4>")`;
// below doesn't work anymore due to constructor cleanup
// ).slow(1).transpose.cat(0, 2, 3, 4)`;

export const confusedPhone = `"[g2 ~@1.3] [c3 ~@1.3]"
.superimpose(
  transpose(-12).late(0),
  transpose(7).late(0.1),
  transpose(10).late(0.2),
  transpose(12).late(0.3),
  transpose(24).late(0.4)
)
.scale(cat('C dorian', 'C mixolydian'))
.scaleTranspose("<0 1 2 1>")
.slow(2)`;

export const technoDrums = `stack(
  "c1*2".tone(new MembraneSynth().toDestination()),
  "~ x".tone(new NoiseSynth().toDestination()),
  "[~ c4]*2".tone(new MetalSynth().set({envelope:{decay:0.06,sustain:0}}).chain(new Gain(0.5),getDestination()))
)`;

/*
export const caverave = `const delay = new FeedbackDelay(1/8, .4).chain(vol(0.5), out());
const kick = new MembraneSynth().chain(vol(.8), out());
const snare = new NoiseSynth().chain(vol(.8), out());
const hihat = new MetalSynth().set(adsr(0, .08, 0, .1)).chain(vol(.3).connect(delay),out());
const bass = new Synth().set({ ...osc('sawtooth'), ...adsr(0, .1, .4) }).chain(lowpass(900), vol(.5), out());
const keys = new PolySynth().set({ ...osc('sawtooth'), ...adsr(0, .5, .2, .7) }).chain(lowpass(1200), vol(.5), out());

const drums = stack(
  "c1*2".tone(kick).mask("<x@7 ~>/8"),
  "~ <x!7 [x@3 x]>".tone(snare).mask("<x@7 ~>/4"),
  "[~ c4]*2".tone(hihat)
);

const thru = (x) => x.transpose("<0 1>/8").transpose(-1);
const synths = stack(
  "<eb4 d4 c4 b3>/2".scale(timeCat([3,'C minor'],[1,'C melodic minor']).slow(8)).struct("[~ x]*2")
  .layer(
    scaleTranspose(0).early(0),
    scaleTranspose(2).early(1/8),
    scaleTranspose(7).early(1/4),
    scaleTranspose(8).early(3/8)
  ).apply(thru).tone(keys).mask("<~ x>/16"),
  "<C2 Bb1 Ab1 [G1 [G2 G1]]>/2".struct("[x [~ x] <[~ [~ x]]!3 [x x]>@2]/2".fast(2)).apply(thru).tone(bass),
  "<Cm7 Bb7 Fm7 G7b13>/2".struct("~ [x@0.1 ~]".fast(2)).voicings().apply(thru).every(2, early(1/8)).tone(keys).mask("<x@7 ~>/8".early(1/4))
)
stack(
  drums.fast(2), 
  synths
).slow(2)`; */
