// this file can be used to livecode from the comfort of your editor.
// just export a pattern from export default
// enable hot mode by pressing "toggle hot mode" on the top right of the repl

import { mini, h } from '../src/parse';
import { sequence, pure, reify, slowcat, fastcat, cat, stack, silence } from '../../strudel.mjs';
import { gain, filter } from '../src/tone';

export default stack(
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
      .synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1 },
      })
      .rev()
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
      .synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1 },
      })
      .chain(gain(0.7), filter(2000))
      .rev()
  )
).slow(16);
