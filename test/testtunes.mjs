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
  "Cm7".voicings('lefthand').slow(2)
).transpose(
  "<1 2 3 2>".slow(2)
).transpose(5)`;
// range ['g2','c4']

export const scaleTranspose = `"f2,f3,c4,ab4"
.scale(seq('F minor', 'F harmonic minor').slow(4))
.scaleTranspose("<0 -1 -2 -3>")
.transpose("0 1".slow(16))`;

export const struct = `stack(
  "c2 g2 a2 [e2@2 eb2] d2 a2 g2 [d2 ~ db2]",
  "[C^7 A7] [Dm7 G7]".struct("[x@2 x] [~@2 x] [~ x@2]@2 [x ~@2] ~ [~@2 x@4]@2")
  .voicings('lefthand')
).slow(4)`;
// range ['G3','A4']

export const magicSofa = `stack(
  "<C^7 F^7 ~> <Dm7 G7 A7 ~>"
   .every(2, fast(2))
   .voicings('lefthand'),
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
  "<Cm7 Bb7 Fm7 G7b13>/2".struct("~ [x@0.1 ~]".fast(2)).voicings('lefthand').apply(thru).every(2, early(1/8)).tone(keys).mask("<x@7 ~>/8".early(1/4))
)
stack(
  drums.fast(2), 
  synths
).slow(2)`; */

export const tetrisMini = `note(\`[[e5 [b4 c5] d5 [c5 b4]]
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
[[a1 a2]*4]\`).slow(16)
`;

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
  .voicings('lefthand'),
  // bass
  seq(
    "[B2 D2] [G2 D2] [Eb2 Bb2] [A2 D2]",
    "[G2 Bb2] [Eb2 F#2] [B2 F#2] [F2 Bb2]",
    "[Eb2 Bb2] [A2 D2] [G2 D2] [C#2 F#2]",
    "[B2 F#2] [F2 Bb2] [Eb2 Bb2] [C#2 F#2]"
  )
  .struct("x ~".fast(4*8))
).slow(25).note()`;

// range ['E3', 'G4']

// TODO:
/*
export const xylophoneCalling = `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Felix Roos
const t = x => x.scaleTranspose("<0 2 4 3>/4").transpose(-2)
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
*/

// TODO:
/*
export const sowhatelse = `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Felix Roos
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
*/

// TODO: rework tune to use freq
/*
export const jemblung = `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Felix Roos
const delay = new FeedbackDelay(1/8, .6).chain(vol(0.15), out());
const snare = noise({type:'white',...adsr(0,0.2,0)}).chain(lowpass(5000),vol(1.8),out());
const s = polysynth().set({...osc('sawtooth4'),...adsr(0.01,.2,.6,0.2)}).chain(vol(.23).connect(delay),out());
stack(
  stack(
    "0 1 4 [3!2 5]".layer(
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
*/

/*
// TODO: does not work on linux (at least for me..)
export const speakerman = `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Felix Roos
backgroundImage('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.ytimg.com%2Fvi%2FXR0rKqW3VwY%2Fmaxresdefault.jpg&f=1&nofb=1', 
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
*/

export const bossa = `const scales = sequence('C minor', ['D locrian', 'G phrygian'], 'Bb2 minor', ['C locrian','F phrygian']).slow(4)
stack(
  "<Cm7 [Dm7b5 G7b9] Bbm7 [Cm7b5 F7b9]>".fast(2).struct("x ~ x@3 x ~ x ~ ~ ~ x ~ x@3".late(1/8)).early(1/8).slow(2).voicings('lefthand'),
  "[~ [0 ~]] 0 [~ [4 ~]] 4".sub(7).restart(scales).scale(scales).early(.25)
).note().piano().slow(2)`;

/* 
export const customTrigger = `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// by Felix Roos
stack(
  freq("55 [110,165] 110 [220,275]".mul("<1 <3/4 2/3>>").struct("x(3,8)").layer(x=>x.mul("1.006,.995"))),
  freq("440(5,8)".clip(.18).mul("<1 3/4 2 2/3>")).gain(perlin.range(.2,.8))
).s("<sawtooth square>/2")
  .onTrigger((t,hap,ct)=>{
  const ac = Tone.getContext().rawContext;
  t = ac.currentTime + t - ct;
  const { freq, s, gain = 1 } = hap.value;
  const master = ac.createGain();
  master.gain.value = 0.1 * gain;
  master.connect(ac.destination);
  const o = ac.createOscillator();
  o.type = s || 'triangle';
  o.frequency.value = Number(freq);
  o.connect(master);
  o.start(t);
  o.stop(t + hap.duration);
}).stack(s("bd(3,8),hh*4,~ sd").webdirt())`; */

export const swimmingWithSoundfonts = `// Koji Kondo - Swimming (Super Mario World)
stack(
    n(
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
    ).s('Sitar: Ethnic'),
    n(
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
    ).s('Kalimba: Ethnic'),
    n(
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
    ).s('Acoustic Bass: Bass')
  ).slow(51)
    `;

export const bossaRandom = `const chords = "<Am7 Am7 Dm7 E7>"
const roots = chords.rootNotes(2)

stack(
  chords.voicings('lefthand').struct(
  \` x@2   ~ x ~ ~ ~ x |
    x?  ~ ~ x@3   ~ x |
    x?  ~ ~ x ~ x@3\`),
  roots.struct("x [~ x?0.2] x [~ x?] | x!4 | x@2 ~ ~ ~ x x x").transpose("0 7")
).slow(2).pianoroll().note().piano()`;

// range ['F4', 'A5']
