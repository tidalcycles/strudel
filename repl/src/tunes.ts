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

export const swimming = `stack(
  cat(
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
  cat(
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
  cat(
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

export const giantStepsReggae = `stack(
  // melody
  cat(
    "[F#5 D5] [B4 G4] Bb4 [B4 A4]",
    "[D5 Bb4] [G4 Eb4] F#4 [G4 F4]",
    "Bb4 [B4 A4] D5 [D#5 C#5]",
    "F#5 [G5 F5] Bb5 [F#5 [F#5 ~@3]]",
  ),
  // chords
  cat(
    "[B^7 D7] [G^7 Bb7] Eb^7 [Am7 D7]",
    "[G^7 Bb7] [Eb^7 F#7] B^7 [Fm7 Bb7]",
    "Eb^7 [Am7 D7] G^7 [C#m7 F#7]",
    "B^7 [Fm7 Bb7] Eb^7 [C#m7 F#7]"
  )
  .struct("~ [x ~]".fast(4*8))
  .voicings(['E3', 'G4']),
  // bass
  cat(
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

export const confusedPhone = `"[g2 ~@1.3] [c3 ~@1.3]"
.superimpose(
  transpose(-12).late(0),
  transpose(7).late(0.1),
  transpose(10).late(0.2),
  transpose(12).late(0.3),
  transpose(24).late(0.4)
)
.scale(slowcat('C dorian', 'C mixolydian'))
.scaleTranspose(slowcat(0,1,2,1))
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
  "c1*2".tone(new Tone.MembraneSynth().toDestination()),
  "~ x".tone(new Tone.NoiseSynth().toDestination()),
  "[~ c4]*2".tone(new Tone.MetalSynth().set({envelope:{decay:0.06,sustain:0}}).chain(new Gain(0.5),getDestination()))
)`;

export const loungerave = `() => {
  const delay = new FeedbackDelay(1/8, .2).chain(vol(0.5), out());
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
  return stack(
    drums, 
    synths
  )
  //.mask("<x ~>*4")
  //.early("0.25 0");
}`;

export const caverave = `() => {
  const delay = new FeedbackDelay(1/8, .4).chain(vol(0.5), out());
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
  return stack(
    drums.fast(2), 
    synths
  ).slow(2);
}`;

export const callcenterhero = `()=>{
  const bpm = 90;
  const lead = polysynth().set({...osc('sine4'),...adsr(.004)}).chain(vol(0.15),out())
  const bass = fmsynth({...osc('sawtooth6'),...adsr(0.05,.6,0.8,0.1)}).chain(vol(0.6), out());
  const s = scale(slowcat('F3 minor', 'Ab3 major', 'Bb3 dorian', 'C4 phrygian dominant').slow(4));
  return stack(
    "0 2".struct("<x ~> [x ~]").apply(s).scaleTranspose(stack(0,2)).tone(lead),
    "<6 7 9 7>".struct("[~ [x ~]*2]*2").apply(s).scaleTranspose("[0,2] [2,4]".fast(2).every(4,rev)).tone(lead),
  	"-14".struct("[~ x@0.8]*2".early(0.01)).apply(s).tone(bass),
    "c2*2".tone(membrane().chain(vol(0.6), out())),
    "~ c2".tone(noise().chain(vol(0.2), out())),
    "c4*4".tone(metal(adsr(0,.05,0)).chain(vol(0.03), out()))
  )
  .slow(120 / bpm)
}
`;

export const primalEnemy = `()=>{
  const f = fast("<1 <2 [4 8]>>");
  return stack(
    "c3,g3,c4".struct("[x ~]*2").apply(f).transpose("<0 <3 [5 [7 [9 [11 13]]]]>>"),
    "c2 [c2 ~]*2".tone(synth(osc('sawtooth8')).chain(vol(0.8),out())),
    "c1*2".tone(membrane().chain(vol(0.8),out()))
  ).slow(1)
}`;

export const drums = `stack(
  "c1*2".tone(membrane().chain(vol(0.8),out())),
  "~ c3".tone(noise().chain(vol(0.8),out())),
  "c3*4".transpose("[-24 0]*2").tone(metal(adsr(0,.015)).chain(vol(0.8),out()))
)
`;

export const xylophoneCalling = `()=>{
  const t = x=> x.scaleTranspose("<0 2 4 3>/4").transpose(-2)
  const s = x => x.scale(slowcat('C3 minor pentatonic','G3 minor pentatonic').slow(4))
  const delay = new FeedbackDelay(1/8, .6).chain(vol(0.1), out());
  const chorus = new Chorus(1,2.5,0.5).start();
  return stack(
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
}`;

export const sowhatelse = `()=> {
  // mixer
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
  return stack(
    "[<0 4 [3 [2 1]]>]/4".struct("[x]*3").mask("[~ x ~]").scale('D5 dorian').off(1/6, scaleTranspose(-7)).off(1/3, scaleTranspose(-5)).apply(t).tone(instr('lead')).mask("<~ ~ x x>/8"),
    "<<e3 [~@2 a3]> <[d3 ~] [c3 f3] g3>>".scale('D dorian').apply(sowhat).apply(t).tone(instr('organ')).mask("<x x x ~>/8"),
    "<[d2 [d2 ~]*3]!3 <a1*2 c2*3 [a1 e2]>>".apply(t).tone(instr('bass')),
    "c1*6".tone(instr('hihat')),
    "~ c3".tone(instr('snare')),
    "<[c1@5 c1] <c1 [[c1@2 c1] ~] [c1 ~ c1] [c1!2 ~ c1!3]>>".tone(instr('kick')),
    "[2,4]/4".scale('D dorian').apply(t).tone(instr('pad')).mask("<x x x ~>/8")
  ).fast(6/8)
}`;

export const barryHarris = `piano()
.then(p => "0,2,[7 6]"
  .add("<0 1 2 3 4 5 7 8>")
  .scale('C bebop major')
  .transpose("<0 1 2 1>/8")
  .slow(2)
  .tone(p.toDestination()))
`;

export const blippyRhodes = `Promise.all([
  players({
    bd: 'samples/tidal/bd/BT0A0D0.wav',
    sn: 'samples/tidal/sn/ST0T0S3.wav',
    hh: 'samples/tidal/hh/000_hh3closedhh.wav'
  }, 'https://loophole-letters.vercel.app/'),
  sampler({
    E1: 'samples/rhodes/MK2Md2000.mp3',
    E2: 'samples/rhodes/MK2Md2012.mp3',
    E3: 'samples/rhodes/MK2Md2024.mp3',
    E4: 'samples/rhodes/MK2Md2036.mp3',
    E5: 'samples/rhodes/MK2Md2048.mp3',
    E6: 'samples/rhodes/MK2Md2060.mp3',
    E7: 'samples/rhodes/MK2Md2072.mp3'
  }, 'https://loophole-letters.vercel.app/')
])
  .then(([drums, rhodes])=>{
  const delay = new FeedbackDelay(1/12, .4).chain(vol(0.3), out());
  rhodes = rhodes.chain(vol(0.5).connect(delay), out());
  const bass = synth(osc('sawtooth8')).chain(vol(.5),out());
  const scales = ['C major', 'C mixolydian', 'F lydian', ['F minor',slowcat('Db major','Db mixolydian')]];
  const t = x => x.scale(sequence(...scales).slow(4));
  return stack(
    "<bd sn> <hh hh*2 hh*3>".tone(drums.chain(out())),
    "<g4 c5 a4 [ab4 <eb5 f5>]>".apply(t).struct("x*8").apply(scaleTranspose("0 [-5,-2] -7 [-9,-2]")).legato(.2).slow(2).tone(rhodes),
    //"<C^7 C7 F^7 [Fm7 <Db^7 Db7>]>".slow(2).voicings().struct("~ x").legato(.25).tone(rhodes),
    "<c2 c3 f2 [[F2 C2] db2]>".legato("<1@3 [.3 1]>").slow(2).tone(bass),
  ).fast(3/2)
})`;

export const wavyKalimba = `sampler({
  C5: 'https://freesound.org/data/previews/536/536549_11935698-lq.mp3'
}).then((kalimba)=>{
  const delay = new FeedbackDelay(1/3, .5).chain(vol(.2), out());
  kalimba = kalimba.chain(vol(0.6).connect(delay),out());
  const scales = sequence('C major', 'C mixolydian', 'F lydian', ['F minor', 'Db major']).slow(4);
  return stack(
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
    .fast(1)
})`;

export const jemblung = `() => {
  const delay = new FeedbackDelay(1/8, .6).chain(vol(0.15), out());
  const snare = noise({type:'white',...adsr(0,0.2,0)}).chain(lowpass(5000),vol(1.8),out());
  const s = polysynth().set({...osc('sawtooth4'),...adsr(0.01,.2,.6,0.2)}).chain(vol(.23).connect(delay),out());
  return stack(
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
  ).slow(3)
}`;