export const tetris = `stack(sequence(
  'e5', sequence('b4', 'c5'), 'd5', sequence('c5', 'b4'),
  'a4', sequence('a4', 'c5'), 'e5', sequence('d5', 'c5'),
  'b4', sequence(silence(), 'c5'), 'd5', 'e5',
  'c5', 'a4', 'a4', silence(),
  sequence(silence(), 'd5'), sequence(silence(), 'f5'), 'a5', sequence('g5', 'f5'),
  'e5', sequence(silence(), 'c5'), 'e5', sequence('d5', 'c5'),
  'b4', sequence('b4', 'c5'), 'd5', 'e5',
  'c5', 'a4', 'a4', silence()),
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

// "sequence('c3', 'eb3', sequence('g3', 'f3'))" //
/* `sequence(
      stack('c4','eb4','g4'),
      stack('bb3','d4','f4'),
      stack('ab3','c4','eb4'),
      stack('g3','b3','d4')
    )._slow(4)`, */ //
export const spanish = `slowcat(
      stack('c4','eb4','g4'),
      stack('bb3','d4','f4'),
      stack('ab3','c4','eb4'),
      stack('g3','b3','d4')
    )`;
/* `fastcat(
      stack('c4','eb4','g4'),
      stack('bb3','d4','f4'),
      stack('ab3','c4','eb4'),
      stack('g3','b3','d4')
    )._slow(4)` */ //
// "slow(sequence('c3', 'eb3', sequence('g3', 'f3')), 'g3')" //
// "sequence('c3', 'eb3')._fast(2)" //
