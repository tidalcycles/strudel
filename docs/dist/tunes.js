export const timeCatMini = `s(
  'c3@3 [eb3, g3, [c4 d4]/2]',
  'c2 g2',
  m('[eb4@5 [f4 eb4 d4]@3] [eb4 c4]/2').slow(8)
)`;
export const timeCat = `stack(
  timeCat([3, c3], [1, stack(eb3, g3, m(c4, d4).slow(2))]),
  m(c2, g2),
  sequence(
    timeCat([5, eb4], [3, m(f4, eb4, d4)]), 
    m(eb4, c4).slow(2)
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
export const tetrisMidi = `${shapeShifted}.midi('IAC-Treiber Bus 1')`;
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
)._slow(16)`;
export const tetris = `stack(
  sequence(
    mini(
      'e5 [b4 c5] d5 [c5 b4]',
      'a4 [a4 c5] e5 [d5 c5]',
      'b4 [~ c5] d5 e5',
      'c5 a4 a4 ~',
      '[~ d5] [~ f5] a5 [g5 f5]',
      'e5 [~ c5] e5 [d5 c5]',
      'b4 [b4 c5] d5 e5',
      'c5 a4 a4 ~'
    )
  ),
  sequence(
    mini(
      'e2 e3 e2 e3 e2 e3 e2 e3',
      'a2 a3 a2 a3 a2 a3 a2 a3',
      'g#2 g#3 g#2 g#3 e2 e3 e2 e3',
      'a2 a3 a2 a3 a2 a3 b1 c2',
      'd2 d3 d2 d3 d2 d3 d2 d3',
      'c2 c3 c2 c3 c2 c3 c2 c3',
      'b1 b2 b1 b2 e2 e3 e2 e3',
      'a1 a2 a1 a2 a1 a2 a1 a2'
    )
  )
).slow(16).synth({
  oscillator: {type: 'sawtooth'}
})`;
export const tetrisRev = `stack(
  sequence(
    mini(
      'e5 [b4 c5] d5 [c5 b4]',
      'a4 [a4 c5] e5 [d5 c5]',
      'b4 [~ c5] d5 e5',
      'c5 a4 a4 ~',
      '[~ d5] [~ f5] a5 [g5 f5]',
      'e5 [~ c5] e5 [d5 c5]',
      'b4 [b4 c5] d5 e5',
      'c5 a4 a4 ~'
    ).rev()
  ),
  sequence(
    mini(
      'e2 e3 e2 e3 e2 e3 e2 e3',
      'a2 a3 a2 a3 a2 a3 a2 a3',
      'g#2 g#3 g#2 g#3 e2 e3 e2 e3',
      'a2 a3 a2 a3 a2 a3 b1 c2',
      'd2 d3 d2 d3 d2 d3 d2 d3',
      'c2 c3 c2 c3 c2 c3 c2 c3',
      'b1 b2 b1 b2 e2 e3 e2 e3',
      'a1 a2 a1 a2 a1 a2 a1 a2'
    ).rev()
  )
).slow(16).synth('sawtooth').filter(1000).gain(0.6)`;
export const tetrisMini1 = `m\`[[e5 [b4 c5] d5 [c5 b4]] [a4 [a4 c5] e5 [d5 c5]] [b4 [~ c5] d5 e5] [c5 a4 a4 ~] [[~ d5] [~ f5] a5 [g5 f5]] [e5 [~ c5] e5 [d5 c5]] [b4 [b4 c5] d5 e5] [c5 a4 a4 ~]],[[e2 e3 e2 e3 e2 e3 e2 e3] [a2 a3 a2 a3 a2 a3 a2 a3] [g#2 g#3 g#2 g#3 e2 e3 e2 e3] [a2 a3 a2 a3 a2 a3 b1 c2] [d2 d3 d2 d3 d2 d3 d2 d3] [c2 c3 c2 c3 c2 c3 c2 c3] [b1 b2 b1 b2 e2 e3 e2 e3] [a1 a2 a1 a2 a1 a2 a1 a2]]')._slow(16)\``;
export const tetrisMini = `m\`[[e5 [b4 c5] d5 [c5 b4]]
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
[[a1 a2]*4]\`._slow(16);
`;
export const tetrisHaskellH = `h(\`slow 16 $ "[[e5 [b4 c5] d5 [c5 b4]]
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
[[a1 a2]*4]"\`)
`;
export const tetrisHaskell = `slow 16 $ "[[e5 [b4 c5] d5 [c5 b4]]
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
[[a1 a2]*4]"
`;
export const spanish = `slowcat(
      stack('c4','eb4','g4'),
      stack('bb3','d4','f4'),
      stack('ab3','c4','eb4'),
      stack('g3','b3','d4')
    )`;
export const whirlyStrudel = `mini("[e4 [b2  b3] c4]")
  .every(4, x => x.fast(2))
  .every(3, x => x.slow(1.5))
  .fast(slowcat(1.25,1,1.5))
  .every(2, _ => mini("e4 ~ e3 d4 ~"))`;
export default shapeShifted;
