/*
oldtunes.mjs - <short description TODO>
Copyright (C) 2022 <author(s) TODO> and contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

export const timeCatMini = `stack(
  "c3@3 [eb3, g3, [c4 d4]/2]",
  "c2 g2",
  "[eb4@5 [f4 eb4 d4]@3] [eb4 c4]/2".slow(8)
)`;

export const timeCat = `stack(
  timeCat([3, c3], [1, stack(eb3, g3, cat(c4, d4).slow(2))]),
  cat(c2, g2),
  sequence(
    timeCat([5, eb4], [3, cat(f4, eb4, d4)]), 
    cat(eb4, c4).slow(2)
  ).slow(4)
)`;

export const shapeShifted = `stack(
  sequence(
    e5, [b4, c5], d5, [c5, b4],
    a4, [a4, c5], e5, [d5, c5],
    b4, [r, c5], d5, e5,
    c5, a4, a4, r,
    [r, d5], [r, f5], a5, [g5, f5],
    e5, [r, c5], e5, [d5, c5],
    b4, [b4, c5], d5, e5,
    c5, a4, a4, r,
  ).rev(),
  sequence(
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

export const tetrisWithFunctions = `stack(sequence(
  'e5', sequence('b4', 'c5'), 'd5', sequence('c5', 'b4'),
  'a4', sequence('a4', 'c5'), 'e5', sequence('d5', 'c5'),
  'b4', sequence(silence, 'c5'), 'd5', 'e5',
  'c5', 'a4', 'a4', silence,
  sequence(silence, 'd5'), sequence(silence, 'f5'), 'a5', sequence('g5', 'f5'),
  'e5', sequence(silence, 'c5'), 'e5', sequence('d5', 'c5'),
  'b4', sequence('b4', 'c5'), 'd5', 'e5',
  'c5', 'a4', 'a4', silence),
  sequence(
    'e2', 'e3', 'e2', 'e3', 'e2', 'e3', 'e2', 'e3',
    'a2', 'a3', 'a2', 'a3', 'a2', 'a3', 'a2', 'a3',
    'g#2', 'g#3', 'g#2', 'g#3', 'e2', 'e3', 'e2', 'e3',
    'a2', 'a3', 'a2', 'a3', 'a2', 'a3', 'b1', 'c2',
    'd2', 'd3', 'd2', 'd3', 'd2', 'd3', 'd2', 'd3',
    'c2', 'c3', 'c2', 'c3', 'c2', 'c3', 'c2', 'c3',
    'b1', 'b2', 'b1', 'b2', 'e2', 'e3', 'e2', 'e3',
    'a1', 'a2', 'a1', 'a2', 'a1', 'a2', 'a1', 'a2',
  )
).slow(16)`;

export const tetris = `stack(
  cat(
    "e5 [b4 c5] d5 [c5 b4]",
    "a4 [a4 c5] e5 [d5 c5]",
    "b4 [~ c5] d5 e5",
    "c5 a4 a4 ~",
    "[~ d5] [~ f5] a5 [g5 f5]",
    "e5 [~ c5] e5 [d5 c5]",
    "b4 [b4 c5] d5 e5",
    "c5 a4 a4 ~"
  ),
  cat(
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

export const whirlyStrudel = `sequence(e4, [b2,  b3], c4)
.every(4, fast(2))
.every(3, slow(1.5))
.fast(slowcat(1.25, 1, 1.5))
.every(2, _ => sequence(e4, r, e3, d4, r))`;

export const giantSteps = `stack(
  // melody
  cat(
    "[F#5 D5] [B4 G4] Bb4 [B4 A4]",
    "[D5 Bb4] [G4 Eb4] F#4 [G4 F4]",
    "Bb4 [B4 A4] D5 [D#5 C#5]",
    "F#5 [G5 F5] Bb5 [F#5 F#5]",
  ),
  // chords
  cat(
    "[B^7 D7] [G^7 Bb7] Eb^7 [Am7 D7]",
    "[G^7 Bb7] [Eb^7 F#7] B^7 [Fm7 Bb7]",
    "Eb^7 [Am7 D7] G^7 [C#m7 F#7]",
    "B^7 [Fm7 Bb7] Eb^7 [C#m7 F#7]"
  ).voicings(['E3', 'G4']),
  // bass
  cat(
    "[B2 D2] [G2 Bb2] [Eb2 Bb3] [A2 D2]",
    "[G2 Bb2] [Eb2 F#2] [B2 F#2] [F2 Bb2]",
    "[Eb2 Bb2] [A2 D2] [G2 D2] [C#2 F#2]",
    "[B2 F#2] [F2 Bb2] [Eb2 Bb3] [C#2 F#2]"
  )
).slow(20);`;

export const transposedChordsHacked = `stack(
  "c2 eb2 g2",
  "Cm7".voicings(['g2','c4']).slow(2)
).transpose(
  slowcat(1, 2, 3, 2).slow(2)
).transpose(5)`;

export const scaleTranspose = `stack(f2, f3, c4, ab4)
.scale(sequence('F minor', 'F harmonic minor').slow(4))
.scaleTranspose(sequence(0, -1, -2, -3).slow(4))
.transpose(sequence(0, 1).slow(16))`;

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
).slow(1).transpose.slowcat(0, 2, 3, 4)`;


export const primalEnemy = `()=>{
  const f = fast("<1 <2 [4 8]>>");
  return stack(
    "c3,g3,c4".struct("[x ~]*2").apply(f).transpose("<0 <3 [5 [7 [9 [11 13]]]]>>"),
    "c2 [c2 ~]*2".tone(synth(osc('sawtooth8')).chain(vol(0.8),out())),
    "c1*2".tone(membrane().chain(vol(0.8),out()))
  ).slow(1)
}`;
