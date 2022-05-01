/*
tunes.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/tunes.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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

export const tetris = `stack(
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

export const tetrisMini = `\`[[e5 [b4 c5] d5 [c5 b4]]
[a4 [a4 c5] e5 [d5 c5]]
[b4 [~ c5] d5 e5]
[c5 a4 a4 ~]
[[~ d5] [~ f5] a5 [g5 f5]]
[e5 [~ c5] e5 [d5 c5]]
[b4 [b4 c5] d5 e5]
[c5 a4 a4 ~]],
[[e2 e3]*4]
[[a2 a3]*4]
[[g#2 g#3]*2 [e2 e3]*2]
[a2 a3 a2 a3 a2 a3 b1 c2]
[[d2 d3]*4]
[[c2 c3]*4]
[[b1 b2]*2 [e2 e3]*2]
[[a1 a2]*4]\`.slow(16)
`;

export const whirlyStrudel = `seq(e4, [b2,  b3], c4)
.every(4, fast(2))
.every(3, slow(1.5))
.fast(cat(1.25, 1, 1.5))
.every(2, _ => seq(e4, r, e3, d4, r))`;

export const swimming = `stack(
  seq(
    "~",
    "~",
    "~",
    "A5 [F5@2 C5] [D5@2 F5] F5",
    "[C5@2 F5] [F5@2 C6] A5 G5",
    "A5 [F5@2 C5] [D5@2 F5] F5",
    "[C5@2 F5] [Bb5 A5 G5] F5@2",
    "A5 [F5@2 C5] [D5@2 F5] F5",
    "[C5@2 F5] [F5@2 C6] A5 G5",
    "A5 [F5@2 C5] [D5@2 F5] F5",
    "[C5@2 F5] [Bb5 A5 G5] F5@2",
    "A5 [F5@2 C5] A5 F5",
    "Ab5 [F5@2 Ab5] G5@2",
    "A5 [F5@2 C5] A5 F5",
    "Ab5 [F5@2 C5] C6@2",
    "A5 [F5@2 C5] [D5@2 F5] F5",
    "[C5@2 F5] [Bb5 A5 G5] F5@2"
  ),
  seq(
    "[F4,Bb4,D5] [[D4,G4,Bb4]@2 [Bb3,D4,F4]] [[G3,C4,E4]@2 [[Ab3,F4] [A3,Gb4]]] [Bb3,E4,G4]",
    "[~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [F3, Bb3, Db3] [F3, Bb3, Db3]]",
    "[~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [F3, B3, D3] [F3, B3, D3]]",
    "[~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [F3, B3, D3] [F3, B3, D3]]",
    "[~ [A3, C4, E4] [A3, C4, E4]] [~ [Ab3, C4, Eb4] [Ab3, C4, Eb4]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [G3, C4, E4] [G3, C4, E4]]",
    "[~ [F3, A3, C4] [F3, A3, C4]] [~ [F3, A3, C4] [F3, A3, C4]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [F3, B3, D3] [F3, B3, D3]]",
    "[~ [F3, Bb3, D4] [F3, Bb3, D4]] [~ [F3, Bb3, C4] [F3, Bb3, C4]] [~ [F3, A3, C4] [F3, A3, C4]] [~ [F3, A3, C4] [F3, A3, C4]]",
    "[~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [F3, B3, D3] [F3, B3, D3]]",
    "[~ [A3, C4, E4] [A3, C4, E4]] [~ [Ab3, C4, Eb4] [Ab3, C4, Eb4]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [G3, C4, E4] [G3, C4, E4]]",
    "[~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [F3, B3, D3] [F3, B3, D3]]",
    "[~ [F3, Bb3, D4] [F3, Bb3, D4]] [~ [F3, Bb3, C4] [F3, Bb3, C4]] [~ [F3, A3, C4] [F3, A3, C4]] [~ [F3, A3, C4] [F3, A3, C4]]",
    "[~ [Bb3, D3, F4] [Bb3, D3, F4]] [~ [Bb3, D3, F4] [Bb3, D3, F4]] [~ [A3, C4, F4] [A3, C4, F4]] [~ [A3, C4, F4] [A3, C4, F4]]",
    "[~ [Ab3, B3, F4] [Ab3, B3, F4]] [~ [Ab3, B3, F4] [Ab3, B3, F4]] [~ [G3, Bb3, F4] [G3, Bb3, F4]] [~ [G3, Bb3, E4] [G3, Bb3, E4]]",
    "[~ [Bb3, D3, F4] [Bb3, D3, F4]] [~ [Bb3, D3, F4] [Bb3, D3, F4]] [~ [A3, C4, F4] [A3, C4, F4]] [~ [A3, C4, F4] [A3, C4, F4]]",
    "[~ [Ab3, B3, F4] [Ab3, B3, F4]] [~ [Ab3, B3, F4] [Ab3, B3, F4]] [~ [G3, Bb3, F4] [G3, Bb3, F4]] [~ [G3, Bb3, E4] [G3, Bb3, E4]]",
    "[~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, A3, C3] [F3, A3, C3]] [~ [F3, Bb3, D3] [F3, Bb3, D3]] [~ [F3, B3, D3] [F3, B3, D3]]",
    "[~ [F3, Bb3, D4] [F3, Bb3, D4]] [~ [F3, Bb3, C4] [F3, Bb3, C4]] [~ [F3, A3, C4] [F3, A3, C4]] [~ [F3, A3, C4] [F3, A3, C4]]"
  ),
  seq(
    "[G3 G3 C3 E3]",
    "[F2 D2 G2 C2]",
    "[F2 D2 G2 C2]",
    "[F2 A2 Bb2 B2]",
    "[A2 Ab2 G2 C2]",
    "[F2 A2 Bb2 B2]",
    "[G2 C2 F2 F2]",
    "[F2 A2 Bb2 B2]",
    "[A2 Ab2 G2 C2]",
    "[F2 A2 Bb2 B2]",
    "[G2 C2 F2 F2]",
    "[Bb2 Bb2 A2 A2]",
    "[Ab2 Ab2 G2 [C2 D2 E2]]",
    "[Bb2 Bb2 A2 A2]",
    "[Ab2 Ab2 G2 [C2 D2 E2]]",
    "[F2 A2 Bb2 B2]",
    "[G2 C2 F2 F2]"
  )
).slow(51);
`;

export const giantSteps = `stack(
  // melody
  seq(
    "[F#5 D5] [B4 G4] Bb4 [B4 A4]",
    "[D5 Bb4] [G4 Eb4] F#4 [G4 F4]",
    "Bb4 [B4 A4] D5 [D#5 C#5]",
    "F#5 [G5 F5] Bb5 [F#5 F#5]",
  ),
  // chords
  seq(
    "[B^7 D7] [G^7 Bb7] Eb^7 [Am7 D7]",
    "[G^7 Bb7] [Eb^7 F#7] B^7 [Fm7 Bb7]",
    "Eb^7 [Am7 D7] G^7 [C#m7 F#7]",
    "B^7 [Fm7 Bb7] Eb^7 [C#m7 F#7]"
  ).voicings(['E3', 'G4']),
  // bass
  seq(
    "[B2 D2] [G2 Bb2] [Eb2 Bb3] [A2 D2]",
    "[G2 Bb2] [Eb2 F#2] [B2 F#2] [F2 Bb2]",
    "[Eb2 Bb2] [A2 D2] [G2 D2] [C#2 F#2]",
    "[B2 F#2] [F2 Bb2] [Eb2 Bb3] [C#2 F#2]"
  )
).slow(20)`;

export const giantStepsReggae = `stack(
  // melody
  seq(
    "[F#5 D5] [B4 G4] Bb4 [B4 A4]",
    "[D5 Bb4] [G4 Eb4] F#4 [G4 F4]",
    "Bb4 [B4 A4] D5 [D#5 C#5]",
    "F#5 [G5 F5] Bb5 [F#5 [F#5 ~@3]]",
  ),
  // chords
  seq(
    "[B^7 D7] [G^7 Bb7] Eb^7 [Am7 D7]",
    "[G^7 Bb7] [Eb^7 F#7] B^7 [Fm7 Bb7]",
    "Eb^7 [Am7 D7] G^7 [C#m7 F#7]",
    "B^7 [Fm7 Bb7] Eb^7 [C#m7 F#7]"
  )
  .struct("~ [x ~]".fast(4*8))
  .voicings(['E3', 'G4']),
  // bass
  seq(
    "[B2 D2] [G2 D2] [Eb2 Bb2] [A2 D2]",
    "[G2 Bb2] [Eb2 F#2] [B2 F#2] [F2 Bb2]",
    "[Eb2 Bb2] [A2 D2] [G2 D2] [C#2 F#2]",
    "[B2 F#2] [F2 Bb2] [Eb2 Bb2] [C#2 F#2]"
  )
  .struct("x ~".fast(4*8))
).slow(25)`;

export const transposedChordsHacked = `stack(
  "c2 eb2 g2",
  "Cm7".voicings(['g2','c4']).slow(2)
).transpose(
  cat(1, 2, 3, 2).slow(2)
).transpose(5)`;

export const scaleTranspose = `stack(f2, f3, c4, ab4)
.scale(seq('F minor', 'F harmonic minor').slow(4))
.scaleTranspose(seq(0, -1, -2, -3).slow(4))
.transpose(seq(0, 1).slow(16))`;

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
).slow(1).transpose(cat(0, 2, 3, 4))`;
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
.scaleTranspose(cat(0,1,2,1))
.slow(2)`;

export const zeldasRescue = `stack(
  // melody
  \`[B3@2 D4] [A3@2 [G3 A3]] [B3@2 D4] [A3] 
  [B3@2 D4] [A4@2 G4] [D4@2 [C4 B3]] [A3]
  [B3@2 D4] [A3@2 [G3 A3]] [B3@2 D4] [A3]
  [B3@2 D4] [A4@2 G4] D5@2 
  [D5@2 [C5 B4]] [[C5 B4] G4@2] [C5@2 [B4 A4]] [[B4 A4] E4@2]
  [D5@2 [C5 B4]] [[C5 B4] G4 C5] [G5] [~ ~ B3]\`,
  // bass
  \`[[C2 G2] E3@2] [[C2 G2] F#3@2] [[C2 G2] E3@2] [[C2 G2] F#3@2]
  [[B1 D3] G3@2] [[Bb1 Db3] G3@2] [[A1 C3] G3@2] [[D2 C3] F#3@2]
  [[C2 G2] E3@2] [[C2 G2] F#3@2] [[C2 G2] E3@2] [[C2 G2] F#3@2]
  [[B1 D3] G3@2] [[Bb1 Db3] G3@2] [[A1 C3] G3@2] [[D2 C3] F#3@2]
  [[F2 C3] E3@2] [[E2 B2] D3@2] [[D2 A2] C3@2] [[C2 G2] B2@2]
  [[F2 C3] E3@2] [[E2 B2] D3@2] [[Eb2 Bb2] Db3@2] [[D2 A2] C3 [F3,G2]]\`
).transpose(12).slow(48).tone(
  new PolySynth().chain(
    new Gain(0.3), 
    new Chorus(2, 2.5, 0.5).start(), 
    new Freeverb(), 
    getDestination())
)`;

export const technoDrums = `stack(
  "c1*2".tone(new MembraneSynth().toDestination()),
  "~ x".tone(new NoiseSynth().toDestination()),
  "[~ c4]*2".tone(new MetalSynth().set({envelope:{decay:0.06,sustain:0}}).chain(new Gain(0.5),getDestination()))
)`;

export const loungerave = `const delay = new FeedbackDelay(1/8, .2).chain(vol(0.5), out());
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

const thru = (x) => x.transpose("<0 1>/8").transpose(1);
const synths = stack(
  "<C2 Bb1 Ab1 [G1 [G2 G1]]>/2".struct("[x [~ x] <[~ [~ x]]!3 [x x]>@2]/2").edit(thru).tone(bass),
  "<Cm7 Bb7 Fm7 G7b9>/2".struct("~ [x@0.1 ~]").voicings().edit(thru).every(2, early(1/4)).tone(keys).mask("<x@7 ~>/8".early(1/4))
)
stack(
  drums, 
  synths
)`;

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
  .edit(
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
).slow(2)`;

export const callcenterhero = `const bpm = 90;
const lead = polysynth().set({...osc('sine4'),...adsr(.004)}).chain(vol(0.15),out())
const bass = fmsynth({...osc('sawtooth6'),...adsr(0.05,.6,0.8,0.1)}).chain(vol(0.6), out());
const s = scale(cat('F3 minor', 'Ab3 major', 'Bb3 dorian', 'C4 phrygian dominant').slow(4));
stack(
  "0 2".struct("<x ~> [x ~]").apply(s).scaleTranspose(stack(0,2)).tone(lead),
  "<6 7 9 7>".struct("[~ [x ~]*2]*2").apply(s).scaleTranspose("[0,2] [2,4]".fast(2).every(4,rev)).tone(lead),
	"-14".struct("[~ x@0.8]*2".early(0.01)).apply(s).tone(bass),
  "c2*2".tone(membrane().chain(vol(0.6), out())),
  "~ c2".tone(noise().chain(vol(0.2), out())),
  "c4*4".tone(metal(adsr(0,.05,0)).chain(vol(0.03), out()))
)
.slow(120 / bpm)`;

export const primalEnemy = `const f = fast("<1 <2 [4 8]>>");
stack(
  "c3,g3,c4".struct("[x ~]*2").apply(f).transpose("<0 <3 [5 [7 [9 [11 13]]]]>>"),
  "c2 [c2 ~]*2".tone(synth(osc('sawtooth8')).chain(vol(0.8),out())),
  "c1*2".tone(membrane().chain(vol(0.8),out()))
).slow(1)`;

export const synthDrums = `stack(
  "c1*2".tone(membrane().chain(vol(0.8),out())),
  "~ c3".tone(noise().chain(vol(0.8),out())),
  "c3*4".transpose("[-24 0]*2").tone(metal(adsr(0,.015)).chain(vol(0.8),out()))
)
`;

export const sampleDrums = `const drums = await players({
  bd: 'bd/BT0A0D0.wav',
  sn: 'sn/ST0T0S3.wav',
  hh: 'hh/000_hh3closedhh.wav'
}, 'https://loophole-letters.vercel.app/samples/tidal/')

stack(
  "<bd!3 bd(3,4,2)>",
  "hh*4",
  "~ <sn!3 sn(3,4,1)>"
).tone(drums.chain(out()))
`;

export const xylophoneCalling = `const t = x => x.scaleTranspose("<0 2 4 3>/4").transpose(-2)
const s = x => x.scale(cat('C3 minor pentatonic','G3 minor pentatonic').slow(4))
const delay = new FeedbackDelay(1/8, .6).chain(vol(0.1), out());
const chorus = new Chorus(1,2.5,0.5).start();
stack(
  // melody
  "<<10 7> <8 3>>/4".struct("x*3").apply(s)
  .scaleTranspose("<0 3 2> <1 4 3>")
  .superimpose(scaleTranspose(2).early(1/8))
  .apply(t).tone(polysynth().set({
    ...osc('triangle4'),
    ...adsr(0,.08,0)
  }).chain(vol(0.2).connect(delay),chorus,out())).mask("<~@3 x>/16".early(1/8)),
  // pad
  "[1,3]/4".scale('G3 minor pentatonic').apply(t).tone(polysynth().set({
    ...osc('square2'),
    ...adsr(0.1,.4,0.8)
  }).chain(vol(0.2),chorus,out())).mask("<~ x>/32"),
  // xylophone
  "c3,g3,c4".struct("<x*2 x>").fast("<1 <2!3 [4 8]>>").apply(s).scaleTranspose("<0 <1 [2 [3 <4 5>]]>>").apply(t).tone(polysynth().set({
    ...osc('sawtooth4'),
    ...adsr(0,.1,0)
  }).chain(vol(0.4).connect(delay),out())).mask("<x@3 ~>/16".early(1/8)),
  // bass
  "c2 [c2 ~]*2".scale('C hirajoshi').apply(t).tone(synth({
    ...osc('sawtooth6'),
    ...adsr(0,.03,.4,.1)
  }).chain(vol(0.4),out())),
  // kick
  "<c1!3 [c1 ~]*2>*2".tone(membrane().chain(vol(0.8),out())),
  // snare
  "~ <c3!7 [c3 c3*2]>".tone(noise().chain(vol(0.8),out())),
  // hihat
  "c3*4".transpose("[-24 0]*2").tone(metal(adsr(0,.02)).chain(vol(0.5).connect(delay),out()))
).slow(1)
// strudel disable-highlighting`;

export const sowhatelse = `// mixer
const mix = (key) => vol({
  chords: .2,
  lead: 0.8,
  bass:  .4,
  snare: .95, 
  kick:  .9,
  hihat: .35,
}[key]||0);
const delay = new FeedbackDelay(1/6, .3).chain(vol(.7), out());
const delay2 = new FeedbackDelay(1/6, .2).chain(vol(.15), out());
const chorus = new Chorus(1,2.5,0.5).start();
// instruments
const instr = (instrument) => ({
  organ: polysynth().set({...osc('sawtooth4'), ...adsr(.01,.2,0)}).chain(mix('chords').connect(delay),out()),
  lead: polysynth().set({...osc('triangle4'),...adsr(0.01,.05,0)}).chain(mix('lead').connect(delay2), out()),
  bass: polysynth().set({...osc('sawtooth8'),...adsr(.02,.05,.3,.2)}).chain(mix('bass'),lowpass(3000), out()),
  pad: polysynth().set({...osc('square2'),...adsr(0.1,.4,0.8)}).chain(vol(0.15),chorus,out()),
  hihat: metal(adsr(0, .02, 0)).chain(mix('hihat'), out()),
  snare: noise(adsr(0, .15,  0.01)).chain(mix('snare'), lowpass(5000), out()),
  kick: membrane().chain(mix('kick'), out())
}[instrument]);
// harmony
const t = transpose("<0 0 1 0>/8");
const sowhat = scaleTranspose("0,3,6,9,11");
// track
stack(
  "[<0 4 [3 [2 1]]>]/4".struct("[x]*3").mask("[~ x ~]").scale('D5 dorian').off(1/6, scaleTranspose(-7)).off(1/3, scaleTranspose(-5)).apply(t).tone(instr('lead')).mask("<~ ~ x x>/8"),
  "<<e3 [~@2 a3]> <[d3 ~] [c3 f3] g3>>".scale('D dorian').apply(sowhat).apply(t).tone(instr('organ')).mask("<x x x ~>/8"),
  "<[d2 [d2 ~]*3]!3 <a1*2 c2*3 [a1 e2]>>".apply(t).tone(instr('bass')),
  "c1*6".tone(instr('hihat')),
  "~ c3".tone(instr('snare')),
  "<[c1@5 c1] <c1 [[c1@2 c1] ~] [c1 ~ c1] [c1!2 ~ c1!3]>>".tone(instr('kick')),
  "[2,4]/4".scale('D dorian').apply(t).tone(instr('pad')).mask("<x x x ~>/8")
).fast(6/8)
// strudel disable-highlighting`;

export const barryHarris = `backgroundImage(
  'https://media.npr.org/assets/img/2017/02/03/barryharris_600dpi_wide-7eb49998aa1af377d62bb098041624c0a0d1a454.jpg',
  {style:'background-size:cover'})
  
"0,2,[7 6]"
  .add("<0 1 2 3 4 5 7 8>")
  .scale('C bebop major')
  .transpose("<0 1 2 1>/8")
  .slow(2)
  .tone((await piano()).toDestination())
`;

export const blippyRhodes = `const delay = new FeedbackDelay(1/12, .4).chain(vol(0.3), out());

const drums = await players({
  bd: 'samples/tidal/bd/BT0A0D0.wav',
  sn: 'samples/tidal/sn/ST0T0S3.wav',
  hh: 'samples/tidal/hh/000_hh3closedhh.wav'
}, 'https://loophole-letters.vercel.app/')

const rhodes = await sampler({
  E1: 'samples/rhodes/MK2Md2000.mp3',
  E2: 'samples/rhodes/MK2Md2012.mp3',
  E3: 'samples/rhodes/MK2Md2024.mp3',
  E4: 'samples/rhodes/MK2Md2036.mp3',
  E5: 'samples/rhodes/MK2Md2048.mp3',
  E6: 'samples/rhodes/MK2Md2060.mp3',
  E7: 'samples/rhodes/MK2Md2072.mp3'
}, 'https://loophole-letters.vercel.app/')

const bass = synth(osc('sawtooth8')).chain(vol(.5),out())
const scales = cat('C major', 'C mixolydian', 'F lydian', ['F minor', cat('Db major','Db mixolydian')])

stack(
  "<bd sn> <hh hh*2 hh*3>"
  .tone(drums.chain(out())),
  "<g4 c5 a4 [ab4 <eb5 f5>]>"
  .scale(scales)
  .struct("x*8")
  .scaleTranspose("0 [-5,-2] -7 [-9,-2]")
  .legato(.3)
  .slow(2)
  .tone(rhodes.chain(vol(0.5).connect(delay), out())),
  //"<C^7 C7 F^7 [Fm7 <Db^7 Db7>]>".slow(2).voicings().struct("~ x").legato(.25).tone(rhodes),
  "<c2 c3 f2 [[F2 C2] db2]>"
  .legato("<1@3 [.3 1]>")
  .slow(2)
  .tone(bass),
).fast(3/2)`;

export const wavyKalimba = `const delay = new FeedbackDelay(1/3, .5).chain(vol(.2), out())
let kalimba = await sampler({
  C5: 'https://freesound.org/data/previews/536/536549_11935698-lq.mp3'
})
kalimba = kalimba.chain(vol(0.6).connect(delay),out());
const scales = cat('C major', 'C mixolydian', 'F lydian', ['F minor', 'Db major'])

stack(
  "[0 2 4 6 9 2 0 -2]*3"
  .add("<0 2>/4")
  .scale(scales)
  .struct("x*8")
  .velocity("<.8 .3 .6>*8")
  .slow(2)
  .tone(kalimba),
  "<c2 c2 f2 [[F2 C2] db2]>"
  .scale(scales)
  .scaleTranspose("[0 <2 4>]*2")
  .struct("x*4")
  .velocity("<.8 .5>*4")
  .velocity(0.8)
  .slow(2)
  .tone(kalimba)
)
  .legato("<.4 .8 1 1.2 1.4 1.6 1.8 2>/8")
  .fast(1)`;

export const jemblung = `const delay = new FeedbackDelay(1/8, .6).chain(vol(0.15), out());
const snare = noise({type:'white',...adsr(0,0.2,0)}).chain(lowpass(5000),vol(1.8),out());
const s = polysynth().set({...osc('sawtooth4'),...adsr(0.01,.2,.6,0.2)}).chain(vol(.23).connect(delay),out());
stack(
  stack(
    "0 1 4 [3!2 5]".edit(
      // chords
      x=>x.add("0,3").duration("0.05!3 0.02"),
      // bass
      x=>x.add("-8").struct("x*8").duration(0.1) 
    ),
    // melody
    "12 11*3 12 ~".duration(0.005) 
  )
  .add("<0 1>")
  .tune("jemblung2")
  //.mul(22/5).round().xen("22edo")
  //.mul(12/5).round().xen("12edo")
  .tone(s),
  // kick
  "[c2 ~]*2".duration(0.05).tone(membrane().chain(out())), 
  // snare
  "[~ c1]*2".early(0.001).tone(snare),
  // hihat
  "c2*8".tone(noise().chain(highpass(6000),vol(0.5).connect(delay),out())),
).slow(3)`;

export const risingEnemy = `stack(
  "2,6"
    .scale('F3 dorian')
    .transpose(sine2.struct("x*64").slow(4).mul(2).round())
    .fast(2)
    .struct("x x*3")
    .legato(".9 .3"),
  "0@3 -3*3".legato(".95@3 .4").scale('F2 dorian')
)
  .transpose("<0 1 2 1>/2".early(0.5))
  .transpose(5)
  .fast(2 / 3)
  .tone((await piano()).toDestination())`;

export const festivalOfFingers = `const chords = "<Cm7 Fm7 G7 F#7>";
stack(
  chords.voicings().struct("x(3,8,-1)").velocity(.5).off(1/7,x=>x.transpose(12).velocity(.2)),
  chords.rootNotes(2).struct("x(4,8,-2)"),
  chords.rootNotes(4)
  .scale(cat('C minor','F dorian','G dorian','F# mixolydian'))
  .struct("x(3,8,-2)".fast(2))
  .scaleTranspose("0 4 0 6".early(".125 .5")).layer(scaleTranspose("0,<2 [4,6] [5,7]>/4"))
).slow(2)
 .velocity(sine.struct("x*8").add(3/5).mul(2/5).fast(8))
 .tone((await piano()).chain(out()))`;

export const festivalOfFingers2 = `const chords =       "<Cm7       Fm7        G7         F#7            >";
const scales = cat('C minor','F dorian','G dorian','F# mixolydian')
stack(
  chords.voicings().struct("x(3,8,-1)").velocity(.5).off(1/7,x=>x.transpose(12).velocity(.2)),
  chords.rootNotes(2).struct("x(4,8)"),
  chords.rootNotes(4)
  .scale(scales)
  .struct("x(3,8,-2)".fast(2))
  .scaleTranspose("0 4 0 6".early(".125 .5")).layer(scaleTranspose("0,<2 [4,6] [5,7]>/3"))
).slow(2).transpose(-1)            
 .legato(cosine.struct("x*8").add(4/5).mul(4/5).fast(8))
 .velocity(sine.struct("x*8").add(3/5).mul(2/5).fast(8))
 .tone((await piano()).chain(out())).fast(3/4)`;

// iter, stut, stutWith
export const undergroundPlumber = `backgroundImage('https://images.nintendolife.com/news/2016/08/video_exploring_the_funky_inspiration_for_the_super_mario_bros_underground_theme/large.jpg',{ className:'darken' })

const drums = await players({
  bd: 'bd/BT0A0D0.wav',
  sn: 'sn/ST0T0S3.wav',
  hh: 'hh/000_hh3closedhh.wav',
  cp: 'cp/HANDCLP0.wav',
}, 'https://loophole-letters.vercel.app/samples/tidal/')
stack(
"<<bd*2 bd> sn> hh".fast(4).slow(2).tone(drums.chain(vol(.5),out())),
  stack(
    "[c2 a1 bb1 ~] ~"
    .stut(2, .6, 1/16)
    .legato(.4)
    .slow(2)
    .tone(synth({...osc('sawtooth7'),...adsr(0,.3,0)}).chain(out())),
    "[g2,[c3 eb3]]".iter(4)
    .stutWith(4, 1/8, (x,n)=>x.transpose(n*12).velocity(Math.pow(.4,n)))
    .legato(.1)
  )
  .transpose("<0@2 5 0 7 5 0 -5>/2")
  
)
  .fast(2/3)
  .pianoroll({minMidi:21,maxMidi:180, background:'transparent',inactive:'#3F8F90',active:'#DE3123'})`;

export const bridgeIsOver = `const breaks = (await players({mad:'https://freesound.org/data/previews/22/22274_109943-lq.mp3'})).chain(out())
stack(
  stack(
  "c3*2 [[c3@1.4 bb2] ab2] gb2*2 <[[gb2@1.4 ab2] bb2] gb2>".legato(".5 1".fast(2)).velocity(.8),
  "0 ~".scale('c4 whole tone')
    .euclidLegato(3,8).slow(2).mask("x ~")
    .stutWith(8, 1/16, (x,n)=>x.scaleTranspose(n).velocity(Math.pow(.7,n)))
    .scaleTranspose("<0 1 2 3 4 3 2 1>")
    .fast(2)
    .velocity(.7)
    .legato(.5)
    .stut(3, .5, 1/8)
  ).transpose(-1).tone((await piano()).chain(out())),
  "mad".slow(2).tone(breaks)
).cpm(78).slow(4).pianoroll()
`;

export const goodTimes = `const scale = cat('C3 dorian','Bb2 major').slow(4);
stack(
  "2*4".add(12).scale(scale)
  .off(1/8,x=>x.scaleTranspose("2")).fast(2)
  .scaleTranspose("<0 1 2 1>").hush(),
  "<0 1 2 3>(3,8,2)"
  .scale(scale)
  .off(1/4,x=>x.scaleTranspose("2,4")),
  "<0 4>(5,8)".scale(scale).transpose(-12)
)
  .velocity(".6 .7".fast(4))
  .legato("2")
  .scale(scale)
.scaleTranspose("<0>".slow(4))
.tone((await piano()).chain(out()))
//.midi()
.velocity(.8)
.transpose(5)
.slow(2)
.pianoroll({maxMidi:100,minMidi:20})`;

export const echoPiano = `"<0 2 [4 6](3,4,1) 3*2>"
.scale('D minor')
.color('salmon')
.off(1/4, x=>x.scaleTranspose(2).color('green'))
.off(1/2, x=>x.scaleTranspose(6).color('steelblue'))
.legato(.5)
.echo(4, 1/8, .5)
.tone((await piano()).chain(out()))
.pianoroll()`;

export const sml1 = `
stack(
  // melody
  \`<
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [e5 f5] [g5 a5]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ g6] [g6 ~]
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [a5 g5] [c6 [e5@2 d5]]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ [g6@2 ~] ~@2] [g5 ~] 
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [f5 ~] [[g5@2 f5] ~] [[e5 ~] [f5 ~]] [[f#5 ~] [g5 ~]]
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [eb6 d6] [~ c6] ~!2
  >\`
  .legato(.95),
  // sub melody
  \`<
  [~ g4]!2 [~ ab4]!2 [~ a4]!2 [~ bb4]!2 
  [~ a4]!2 [~ g4]!2 [d4 e4] [f4 gb4] ~!2
  [~ g4]!2 [~ ab4]!2 [~ a4]!2 [~ bb4]!2 
  [~ a4]!2 [~ g4]!2 [d4 e4] [f4 gb4] ~!2
  [~ c5]!4 [~ a4]!2 [[c4 ~] [d4 ~]] [[eb4 ~] [e4 ~]]
  [~ c5]!4 [~ eb5]!2 [g4*2 [f4 ~]] [[e4 ~] [d4 ~]]
  >\`,
  // bass
  \`<
  c3!7 a3 f3!2
  e3!2 ~!4
  c3!7 a3 f3!2
  e3!2 ~!4
  f3!2 e3!2 d3!2 ~!2
  f3!2 e3!2 ab3!2 ~!2
  >\`
  .legato(.5)
).fast(2) //.tone((await piano()).chain(out()))`;

export const speakerman = `backgroundImage('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.ytimg.com%2Fvi%2FXR0rKqW3VwY%2Fmaxresdefault.jpg&f=1&nofb=1', 
{ className:'darken', style:'background-size:cover'})
stack(
  "[g3,bb3,d4] [f3,a3,c4] [c3,e3,g3]@2".slow(2).late(.1),
  cat(
  'Baker man',
  'is baking bread',
  'Baker man',
  'is baking bread',
  'Sagabona',
  'kunjani wena',
  'Sagabona',
  'kunjani wena',
  'The night train, is coming',
  'got to keep on running',
  'The night train, is coming',
  'got to keep on running',
  ).speak("en zu en".slow(12), "<0 2 3 4 5 6>".slow(2)),
).slow(4)`;

export const randomBells = `const delay = new FeedbackDelay(1/3, .8).chain(vol(.2), out());
let bell = await sampler({
  C6: 'https://freesound.org/data/previews/411/411089_5121236-lq.mp3'
})
const bass = await sampler({
  d2: 'https://freesound.org/data/previews/608/608286_13074022-lq.mp3'
});
bell = bell.chain(vol(0.6).connect(delay),out());

"0".euclidLegato(3,8)
  .echo(3, 1/16, .5)
  .add(rand.range(0,12))
  .velocity(rand.range(.5,1))
  .legato(rand.range(.4,3))
  .scale(cat('D minor pentatonic')).tone(bell)
  .stack("<D2 A2 G2 F2>".euclidLegato(6,8,1).tone(bass.toDestination()))
  .slow(6)
  .pianoroll({minMidi:20,maxMidi:120,background:'transparent'})`;

export const waa = `"a4 [a3 c3] a3 c3"
.sub("<7 12>/2")
.off(1/8, add("12"))
.off(1/4, add("7"))
.legato(.5)
.slow(2)
.wave("sawtooth square")
.filter('lowpass', "<2000 1000 500>")
.out()`;

export const waar = `"a4 [a3 c3] a3 c3".color('#F9D649')
.sub("<7 12 5 12>".slow(2))
.off(1/4,x=>x.add(7).color("#FFFFFF #0C3AA1 #C63928"))
.off(1/8,x=>x.add(12).color('#215CB6'))
.slow(2)
.legato(sine.range(0.3, 2).slow(28))
.wave("sawtooth square".fast(2))
.filter('lowpass', cosine.range(500,4000).slow(16))
.out()
.pianoroll({minMidi:20,maxMidi:120,background:'#202124'})`;

export const hyperpop = `const lfo = cosine.slow(15);
const lfo2 = sine.slow(16);
const filter1 = x=>x.filter('lowpass', lfo2.range(300,3000));
const filter2 = x=>x.filter('highpass', lfo.range(1000,6000)).filter('lowpass',4000)
const scales = cat('D3 major', 'G3 major').slow(8)

const drums = await players({
  bd: '344/344757_1676145-lq.mp3',
  sn: '387/387186_7255534-lq.mp3',
  hh: '561/561241_12517458-lq.mp3',
  hh2:'44/44944_236326-lq.mp3',
  hh3: '44/44944_236326-lq.mp3',
}, 'https://freesound.org/data/previews/')

stack(
  "-7 0 -7 7".struct("x(5,8,2)").fast(2).sub(7)
  .scale(scales).wave("sawtooth,square").velocity(.3).adsr(0.01,0.1,.5,0)
  .apply(filter1),
  "~@3 [<2 3>,<4 5>]"
  .echo(8,1/16,.7)
  .scale(scales)
  .wave('square').velocity(.7).adsr(0.01,0.1,0).apply(filter1),
  "6 5 4".add(14)
  .superimpose(sub("5"))
  .fast(1).euclidLegato(3,8)
  .mask("<1 0@7>")
  .fast(2)
  .echo(32, 1/8, .9)
  .scale(scales)
  .wave("sawtooth")
  .velocity(.2)
  .adsr(.01,.5,0)
  .apply(filter2)
  //.echo(4,1/16,.5)
).out().stack(
  stack(
    "bd <~@7 [~ bd]>".fast(2),
    "~ sn",
    "[~ hh3]*2"
  ).tone(drums.chain(vol(.18),out())).fast(2)
).slow(2)

//.pianoroll({minMidi:20, maxMidi:160})
// strudel disable-highlighting`;

export const festivalOfFingers3 = `"[-7*3],0,2,6,[8 7]"
.echoWith(4,1/4, (x,n)=>x
          .add(n*7)
          .velocity(1/(n+1))
          .legato(1/(n+1)))
.velocity(perlin.range(.5,.9).slow(8))
.stack("[22 25]*3"
       .legato(sine.range(.5,2).slow(8))
       .velocity(sine.range(.4,.8).slow(5))
       .echo(4,1/12,.5))
.scale(cat('D dorian','G mixolydian','C dorian','F mixolydian'))
.legato(1)
.slow(2)
.tone((await piano()).toDestination())
//.pianoroll({maxMidi:160})`;
