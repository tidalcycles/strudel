/*
pattern.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/test/pattern.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import Fraction from 'fraction.js';

import { deepStrictEqual, strict as assert } from 'assert';

import {
  TimeSpan,
  Hap,
  State,
  Pattern,
  pure,
  stack,
  fastcat,
  slowcat,
  cat,
  sequence,
  polymeter,
  polymeterSteps,
  polyrhythm,
  silence,
  fast,
  timeCat,
  add,
  sub,
  mul,
  div,
  saw,
  saw2,
  isaw,
  isaw2,
  sine,
  sine2,
  square,
  square2,
  tri,
  tri2,
  id,
  ply,
} from '../index.mjs';

import { steady } from '../signal.mjs';

//import { Time } from 'tone';
import pkg from 'tone';
const { Time } = pkg;

const st = (begin, end) => new State(ts(begin, end));
const ts = (begin, end) => new TimeSpan(Fraction(begin), Fraction(end));
const hap = (whole, part, value, context = {}) => new Hap(whole, part, value, context);

const third = Fraction(1, 3);
const twothirds = Fraction(2, 3);

const sameFirst = (a, b) => {
  return assert.deepStrictEqual(a._sortEventsByPart().firstCycle(), b._sortEventsByPart().firstCycle());
};

describe('TimeSpan', function () {
  describe('equals()', function () {
    it('Should be equal to the same value', function () {
      assert.equal(new TimeSpan(0, 4).equals(new TimeSpan(0, 4)), true);
    });
  });
  describe('splitCycles', function () {
    it('Should split two cycles into two', function () {
      assert.equal(new TimeSpan(Fraction(0), Fraction(2)).spanCycles.length, 2);
    });
  });
  describe('intersection_e', function () {
    var a = new TimeSpan(Fraction(0), Fraction(2));
    var b = new TimeSpan(Fraction(1), Fraction(3));
    var c = new TimeSpan(Fraction(1), Fraction(2));
    var d = new TimeSpan(Fraction(1), Fraction(2));
    it('Should create an intersection', function () {
      assert.equal(a.intersection_e(b).equals(c), true);
    });
  });
});

describe('Hap', function () {
  describe('hasOnset()', function () {
    it('True if part includes onset from whole', function () {
      assert.equal(new Hap(new TimeSpan(0, 1), new TimeSpan(0, 1), 'thing').hasOnset(), true);
    });
  });
  var a = new Hap(new TimeSpan(Fraction(0), Fraction(0.5)), new TimeSpan(Fraction(0), Fraction(0.5)), 'a');
  var b = new Hap(new TimeSpan(Fraction(0), Fraction(0.5)), new TimeSpan(Fraction(0), Fraction(0.5)), 'b');
  var c = new Hap(new TimeSpan(Fraction(0), Fraction(0.25)), new TimeSpan(Fraction(0), Fraction(0.5)), 'c');
  var d = new Hap(undefined, new TimeSpan(Fraction(0), Fraction(0.5)), 'd');
  var e = new Hap(undefined, new TimeSpan(Fraction(0), Fraction(0.5)), 'e');
  describe('spanEquals', function () {
    it('True if two haps have the same whole and part', function () {
      assert.equal(a.spanEquals(b), true);
    });
    it("False if two haps don't the same whole and part", function () {
      assert.equal(a.spanEquals(c), false);
    });
    it('True if two haps have the same part and undefined wholes', function () {
      assert.equal(d.spanEquals(e), true);
    });
  });
  describe('resolveState()', () => {
    it('Can increment some state', function () {
      const stateful_value = (state) => {
        const newValue = state['incrementme'];
        // TODO Does the state *need* duplicating here?
        const newState = { ...state };
        newState['incrementme']++;
        return [newState, newValue];
      };
      const state = { incrementme: 10 };
      const ev1 = new Hap(ts(0, 1), ts(0, 1), stateful_value, {}, true);
      const [state2, ev2] = ev1.resolveState(state);
      const [state3, ev3] = ev1.resolveState(state2);
      assert.deepStrictEqual(ev3, new Hap(ts(0, 1), ts(0, 1), 11, {}, false));
      assert.deepStrictEqual(state3, { incrementme: 12 });
    });
  });
  describe('wholeOrPart()', () => {
    const ts1 = new TimeSpan(Fraction(0), Fraction(1));
    const ts0_5 = new TimeSpan(Fraction(0), Fraction(0.5));
    const continuousHap = new Hap(undefined, ts1, 'hello');
    const discreteHap = new Hap(ts1, ts0_5, 'hello');
    it('Can pick a whole', () => {
      assert.deepStrictEqual(discreteHap.wholeOrPart(), ts1);
    });
    it('Can pick a part', () => {
      assert.deepStrictEqual(continuousHap.wholeOrPart(), ts1);
    });
  });
});

describe('Pattern', function () {
  describe('pure', function () {
    it('Can make a pattern', function () {
      assert.equal(pure('hello').query(st(0.5, 2.5)).length, 3);
    });
  });
  describe('fmap()', function () {
    it('Can add things', function () {
      assert.equal(
        pure(3)
          .fmap((x) => x + 4)
          .firstCycle()[0].value,
        7,
      );
    });
  });
  describe('add()', function () {
    it('Can add things', function () {
      assert.equal(pure(3).add(pure(4)).query(st(0, 1))[0].value, 7);
      assert.equal(pure(3).addIn(pure(4)).query(st(0, 1))[0].value, 7);
    });
  });
  describe('addOut()', () => {
    it('Can add things with structure from second pattern', () => {
      sameFirst(sequence(1, 2).addOut(4), sequence(5, 6).struct(true));
    });
  });
  describe('addSqueeze()', () => {
    it('Can add while squeezing the second pattern inside the events of the first', () => {
      sameFirst(
        sequence(1, [2, 3]).addSqueeze(sequence(10, 20, 30)),
        sequence(
          [11, 21, 31],
          [
            [12, 22, 32],
            [13, 23, 33],
          ],
        ),
      );
    });
  });
  describe('addSqueezeOut()', () => {
    it('Can add while squeezing the first pattern inside the events of the second', () => {
      sameFirst(
        sequence(1, [2, 3]).addSqueezeOut(10, 20, 30),
        sequence([11, [12, 13]], [21, [22, 23]], [31, [32, 33]]),
      );
    });
  });
  describe('sub()', function () {
    it('Can subtract things', function () {
      assert.equal(pure(3).sub(pure(4)).query(st(0, 1))[0].value, -1);
    });
  });
  describe('mul()', function () {
    it('Can multiply things', function () {
      assert.equal(pure(3).mul(pure(2)).firstCycle()[0].value, 6);
    });
  });
  describe('div()', function () {
    it('Can divide things', function () {
      assert.equal(pure(3).div(pure(2)).firstCycle()[0].value, 1.5);
    });
  });
  describe('set()', function () {
    it('Can set things in objects', function () {
      assert.deepStrictEqual(
        pure({ a: 4, b: 6 })
          .set(pure({ c: 7 }))
          .firstCycle()[0].value,
        { a: 4, b: 6, c: 7 },
      );
      sameFirst(
        sequence({ a: 1, b: 2 }, { a: 2, b: 2 }, { a: 3, b: 2 }).set({ a: 4, c: 5 }),
        sequence({ a: 4, b: 2, c: 5 }).fast(3),
      );
    });
    it('Can set things with plain values', function () {
      sameFirst(sequence(1, 2, 3).set(4), sequence(4).fast(3));
    });
    describe('setOut()', () => {
      it('Can set things with structure from second pattern', () => {
        sameFirst(sequence(1, 2).setOut(4), pure(4).mask(true, true));
      });
    });
    describe('setSqueeze()', () => {
      it('Can squeeze one pattern inside the events of another', () => {
        sameFirst(
          sequence(1, [2, 3]).setSqueeze(sequence('a', 'b', 'c')),
          sequence(
            ['a', 'b', 'c'],
            [
              ['a', 'b', 'c'],
              ['a', 'b', 'c'],
            ],
          ),
        );
        sameFirst(
          sequence(1, [2, 3]).setSqueeze('a', 'b', 'c'),
          sequence(
            ['a', 'b', 'c'],
            [
              ['a', 'b', 'c'],
              ['a', 'b', 'c'],
            ],
          ),
        );
      });
    });
  });
  describe('stack()', function () {
    it('Can stack things', function () {
      assert.deepStrictEqual(
        stack(pure('a'), pure('b'), pure('c'))
          .firstCycle()
          .map((h) => h.value),
        ['a', 'b', 'c'],
      );
    });
    it('Can stack subpatterns', function () {
      sameFirst(
        stack('a', ['b','c']),
        stack('a', sequence('b', 'c')),
      );
    });
  });
  describe('_fast()', function () {
    it('Makes things faster', function () {
      assert.equal(pure('a')._fast(2).firstCycle().length, 2);
    });
  });
  describe('_fastGap()', function () {
    it('Makes things faster, with a gap', function () {
      assert.deepStrictEqual(
        sequence('a', 'b', 'c')._fastGap(2).firstCycle(),
        sequence(['a', 'b', 'c'], silence).firstCycle(),
      );
      assert.deepStrictEqual(
        sequence('a', 'b', 'c')._fastGap(3).firstCycle(),
        sequence(['a', 'b', 'c'], silence, silence).firstCycle(),
      );
    });
    it('Makes things faster, with a gap, when speeded up further', function () {
      assert.deepStrictEqual(
        sequence('a', 'b', 'c')._fastGap(2).fast(2).firstCycle(),
        sequence(['a', 'b', 'c'], silence, ['a', 'b', 'c'], silence).firstCycle(),
      );
    });
  });
  describe('_compressSpan()', function () {
    it('Can squash cycles of a pattern into a given timespan', function () {
      assert.deepStrictEqual(
        pure('a')._compressSpan(new TimeSpan(0.25, 0.5)).firstCycle(),
        sequence(silence, 'a', silence, silence).firstCycle(),
      );
    });
  });
  describe('fast()', function () {
    it('Makes things faster', function () {
      assert.equal(pure('a').fast(2).firstCycle().length, 2);
    });
    it('Makes things faster, with a pattern of factors', function () {
      assert.equal(pure('a').fast(sequence(1, 4)).firstCycle().length, 3);
      // .fast(sequence(1,silence) is a quick hack to cut an event in two..
      assert.deepStrictEqual(
        pure('a').fast(sequence(1, 4)).firstCycle(),
        stack(pure('a').fast(sequence(1, silence)), sequence(silence, ['a', 'a'])).firstCycle(),
      );
    });
    it('defaults to accepting sequences', function () {
      assert.deepStrictEqual(
        sequence(1, 2, 3).fast(sequence(1.5, 2)).firstCycle(),
        sequence(1, 2, 3).fast(1.5, 2).firstCycle(),
      );
    });
    it('works as a static function', function () {
      assert.deepStrictEqual(
        sequence(1, 2, 3).fast(1, 2).firstCycle(),
        fast(sequence(1, 2), sequence(1, 2, 3)).firstCycle(),
      );
    });
    it('works as a curried static function', function () {
      assert.deepStrictEqual(
        sequence(1, 2, 3).fast(1, 2).firstCycle(),
        fast(sequence(1, 2))(sequence(1, 2, 3)).firstCycle(),
      );
    });
  });
  describe('_slow()', function () {
    it('Makes things slower', function () {
      assert.deepStrictEqual(
        pure('a')._slow(2).firstCycle()[0],
        new Hap(new TimeSpan(Fraction(0), Fraction(2)), new TimeSpan(Fraction(0), Fraction(1)), 'a'),
      );

      const pat = sequence(pure('c3'), pure('eb3')._slow(2)); // => try mini('c3 eb3/2') in repl
      assert.deepStrictEqual(pat.query(st(0, 1))[1], hap(ts(0.5, 1.5), ts(1 / 2, 1), 'eb3'));
      // the following test fails
      /* assert.deepStrictEqual(
        pat.query(ts(1,2))[1], undefined
      ) */
      // expecting [c3 eb3] [c3 ~]
      // what happens [c3 eb3] [c3 eb3]
      // notable examples:
      // mini('[c3 g3]/2 eb3') always plays [c3 eb3]
      // mini('eb3 [c3 g3]/2 ') always plays [c3 g3]
    });
  });
  describe('_filterValues()', function () {
    it('Filters true', function () {
      assert.equal(
        pure(true)
          ._filterValues((x) => x)
          .firstCycle().length,
        1,
      );
    });
  });
  describe('when()', function () {
    it('Always faster', function () {
      assert.equal(
        pure('a')
          .when(pure(true), (x) => x._fast(2))
          .firstCycle().length,
        2,
      );
    });
    it('Never faster', function () {
      assert.equal(
        pure('a')
          .when(pure(false), (x) => x._fast(2))
          .firstCycle().length,
        1,
      );
    });
    it('Can alternate', function () {
      assert.deepStrictEqual(
        pure(10).when(slowcat(true, false), add(3)).fast(4)._sortEventsByPart().firstCycle(),
        fastcat(13, 10, 13, 10).firstCycle(),
      );
    });
  });
  describe('fastcat()', function () {
    it('Can concatenate two things', function () {
      assert.deepStrictEqual(
        fastcat(pure('a'), pure('b'))
          .firstCycle()
          .map((x) => x.value),
        ['a', 'b'],
      );
    });
  });
  describe('fastcat()', function () {
    it('Can go into negative time', function () {
      sameFirst(
        fastcat('a','b','c')
          .late(1000000),
        fastcat('a','b','c'),
      );
    });
  });
  describe('slowcat()', function () {
    it('Can concatenate things slowly', function () {
      assert.deepStrictEqual(
        slowcat('a', 'b')
          .firstCycle()
          .map((x) => x.value),
        ['a'],
      );
      assert.deepStrictEqual(
        slowcat('a', 'b')
          ._early(1)
          .firstCycle()
          .map((x) => x.value),
        ['b'],
      );
      assert.deepStrictEqual(
        slowcat('a', slowcat('b', 'c'))
          ._early(1)
          .firstCycle()
          .map((x) => x.value),
        ['b'],
      );
      assert.deepStrictEqual(
        slowcat('a', slowcat('b', 'c'))
          ._early(3)
          .firstCycle()
          .map((x) => x.value),
        ['c'],
      );
    });
    it ('Can cat subpatterns', () => {
      sameFirst(
        slowcat('a', ['b','c']).fast(4),
        sequence('a', ['b', 'c']).fast(2)
      )
    })
  });
  describe('rev()', function () {
    it('Can reverse things', function () {
      assert.deepStrictEqual(
        fastcat('a', 'b', 'c')
          .rev()
          .firstCycle()
          .sort((a, b) => a.part.begin.sub(b.part.begin))
          .map((a) => a.value),
        ['c', 'b', 'a'],
      );
    });
  });
  describe('sequence()', () => {
    it('Can work like fastcat', () => {
      assert.deepStrictEqual(sequence(1, 2, 3).firstCycle(), fastcat(1, 2, 3).firstCycle());
    });
  });
  describe('polyrhythm()', () => {
    it('Can layer up cycles', () => {
      assert.deepStrictEqual(
        polyrhythm(['a', 'b'], ['c']).firstCycle(),
        stack(fastcat(pure('a'), pure('b')), pure('c')).firstCycle(),
      );
    });
  });
  describe('polymeter()', () => {
    it('Can layer up cycles, stepwise', () => {
      assert.deepStrictEqual(
        polymeterSteps(3, ['d', 'e']).firstCycle(),
        fastcat(pure('d'), pure('e'), pure('d')).firstCycle(),
      );
      assert.deepStrictEqual(
        polymeter(['a', 'b', 'c'], ['d', 'e']).fast(2).firstCycle(),
        stack(sequence('a', 'b', 'c', 'a', 'b', 'c'), sequence('d', 'e', 'd', 'e', 'd', 'e')).firstCycle(),
      );
    });
  });

  describe('every()', () => {
    it('Can apply a function every 3rd time', () => {
      assert.deepStrictEqual(
        pure('a')
          .every(3, (x) => x._fast(2))
          ._fast(3)
          .firstCycle(),
        sequence(sequence('a', 'a'), 'a', 'a').firstCycle(),
      );
    });
    it('works with currying', () => {
      assert.deepStrictEqual(
        pure('a').every(3, fast(2))._fast(3).firstCycle(),
        sequence(sequence('a', 'a'), 'a', 'a').firstCycle(),
      );
      assert.deepStrictEqual(
        sequence(3, 4, 5).every(3, add(3)).fast(5).firstCycle(),
        sequence(6, 7, 8, 3, 4, 5, 3, 4, 5, 6, 7, 8, 3, 4, 5).firstCycle(),
      );
      assert.deepStrictEqual(
        sequence(3, 4, 5).every(2, sub(1)).fast(5).firstCycle(),
        sequence(2, 3, 4, 3, 4, 5, 2, 3, 4, 3, 4, 5, 2, 3, 4).firstCycle(),
      );
      assert.deepStrictEqual(
        sequence(3, 4, 5).every(3, add(3)).every(2, sub(1)).fast(2).firstCycle(),
        sequence(5, 6, 7, 3, 4, 5).firstCycle(),
      );
    });
  });
  describe('timeCat()', function () {
    it('Can concatenate patterns with different relative durations', function () {
      assert.deepStrictEqual(
        sequence('a', ['a', 'a']).firstCycle(),
        timeCat([1, 'a'], [0.5, 'a'], [0.5, 'a']).firstCycle(),
      );
    });
  });
  describe('struct()', function () {
    it('Can restructure a discrete pattern', function () {
      assert.deepStrictEqual(sequence('a', 'b').struct(sequence(true, true, true)).firstCycle(), [
        hap(ts(0, third), ts(0, third), 'a'),
        hap(ts(third, twothirds), ts(third, 0.5), 'a'),
        hap(ts(third, twothirds), ts(0.5, twothirds), 'b'),
        hap(ts(twothirds, 1), ts(twothirds, 1), 'b'),
      ]);
      assert.deepStrictEqual(
        pure('a')
          .struct(sequence(true, [true, false], true))
          .firstCycle(),
        sequence('a', ['a', silence], 'a').firstCycle(),
      );
      assert.deepStrictEqual(
        pure('a')
          .struct(sequence(true, [true, false], true).invert())
          .firstCycle(),
        sequence(silence, [silence, 'a'], silence).firstCycle(),
      );
      assert.deepStrictEqual(
        pure('a')
          .struct(sequence(true, [true, silence], true))
          .firstCycle(),
        sequence('a', ['a', silence], 'a').firstCycle(),
      );
    });
    it('Can structure a continuous pattern', () => {
      assert.deepStrictEqual(
        steady('a').struct(true, [true, true]).firstCycle(),
        sequence('a', ['a', 'a']).firstCycle(),
      );
    });
  });
  describe('mask()', function () {
    it('Can fragment a pattern', function () {
      assert.deepStrictEqual(sequence('a', 'b').mask(sequence(true, true, true)).firstCycle(), [
        hap(ts(0, 0.5), ts(0, third), 'a'),
        hap(ts(0, 0.5), ts(third, 0.5), 'a'),
        hap(ts(0.5, 1), ts(0.5, twothirds), 'b'),
        hap(ts(0.5, 1), ts(twothirds, 1), 'b'),
      ]);
    });
    it('Can mask off parts of a pattern', function () {
      assert.deepStrictEqual(
        sequence(['a', 'b'], 'c').mask(sequence(true, false)).firstCycle(),
        sequence(['a', 'b'], silence).firstCycle(),
      );
      assert.deepStrictEqual(sequence('a').mask(sequence(true, false)).firstCycle(), [hap(ts(0, 1), ts(0, 0.5), 'a')]);
    });
  });
  describe('invert()', function () {
    it('Can invert a binary pattern', function () {
      assert.deepStrictEqual(
        sequence(true, false, [true, false]).invert().firstCycle(),
        sequence(false, true, [false, true]).firstCycle(),
      );
    });
  });
  describe('signal()', function () {
    it('Can make saw/saw2', function () {
      assert.deepStrictEqual(
        saw.struct(true, true, true, true).firstCycle(),
        sequence(1 / 8, 3 / 8, 5 / 8, 7 / 8).firstCycle(),
      );
      assert.deepStrictEqual(
        saw2.struct(true, true, true, true).firstCycle(),
        sequence(-3 / 4, -1 / 4, 1 / 4, 3 / 4).firstCycle(),
      );
    });
    it('Can make isaw/isaw2', function () {
      assert.deepStrictEqual(
        isaw.struct(true, true, true, true).firstCycle(),
        sequence(7 / 8, 5 / 8, 3 / 8, 1 / 8).firstCycle(),
      );
      assert.deepStrictEqual(
        isaw2.struct(true, true, true, true).firstCycle(),
        sequence(3 / 4, 1 / 4, -1 / 4, -3 / 4).firstCycle(),
      );
    });
  });
  describe('_setContext()', () => {
    it('Can set the event context', () => {
      assert.deepStrictEqual(
        pure('a')
          ._setContext([
            [
              [0, 1],
              [1, 2],
            ],
          ])
          .firstCycle(true),
        [
          hap(ts(0, 1), ts(0, 1), 'a', [
            [
              [0, 1],
              [1, 2],
            ],
          ]),
        ],
      );
    });
  });
  describe('_withContext()', () => {
    it('Can update the event context', () => {
      assert.deepStrictEqual(
        pure('a')
          ._setContext([
            [
              [0, 1],
              [1, 2],
            ],
          ])
          ._withContext((c) => [
            ...c,
            [
              [3, 4],
              [3, 4],
            ],
          ])
          .firstCycle(true),
        [
          hap(ts(0, 1), ts(0, 1), 'a', [
            [
              [0, 1],
              [1, 2],
            ],
            [
              [3, 4],
              [3, 4],
            ],
          ]),
        ],
      );
    });
  });
  describe('apply', () => {
    it('Can apply a function', () => {
      assert.deepStrictEqual(sequence('a', 'b')._apply(fast(2)).firstCycle(), sequence('a', 'b').fast(2).firstCycle());
    }),
      it('Can apply a pattern of functions', () => {
        assert.deepStrictEqual(sequence('a', 'b').apply(fast(2)).firstCycle(), sequence('a', 'b').fast(2).firstCycle());
        assert.deepStrictEqual(
          sequence('a', 'b').apply(fast(2), fast(3)).firstCycle(),
          sequence('a', 'b').fast(2, 3).firstCycle(),
        );
      });
  });
  describe('layer', () => {
    it('Can layer up multiple functions', () => {
      assert.deepStrictEqual(
        sequence(1, 2, 3)
          .layer(fast(2), (pat) => pat.add(3, 4))
          .firstCycle(),
        stack(sequence(1, 2, 3).fast(2), sequence(1, 2, 3).add(3, 4)).firstCycle(),
      );
    });
  });
  describe('early', () => {
    it('Can shift an event earlier', () => {
      assert.deepStrictEqual(pure(30)._late(0.25).query(st(1, 2)), [
        hap(ts(1 / 4, 5 / 4), ts(1, 5 / 4), 30),
        hap(ts(5 / 4, 9 / 4), ts(5 / 4, 2), 30),
      ]);
    });
    it('Can shift an event earlier, into negative time', () => {
      assert.deepStrictEqual(pure(30)._late(0.25).query(st(0, 1)), [
        hap(ts(-3 / 4, 1 / 4), ts(0, 1 / 4), 30),
        hap(ts(1 / 4, 5 / 4), ts(1 / 4, 1), 30),
      ]);
    });
  });
  describe('off', () => {
    it('Can offset a transformed pattern from the original', () => {
      assert.deepStrictEqual(
        pure(30).off(0.25, add(2)).firstCycle(),
        stack(pure(30), pure(30).late(0.25).add(2)).firstCycle(),
      );
    });
  });
  describe('jux', () => {
    it('Can juxtapose', () => {
      assert.deepStrictEqual(
        pure({ a: 1 }).jux(fast(2))._sortEventsByPart().firstCycle(),
        stack(pure({ a: 1, pan: 0 }), pure({ a: 1, pan: 1 }).fast(2))
          ._sortEventsByPart()
          .firstCycle(),
      );
    });
  });
  describe('juxBy', () => {
    it('Can juxtapose by half', () => {
      assert.deepStrictEqual(
        pure({ a: 1 }).juxBy(0.5, fast(2))._sortEventsByPart().firstCycle(),
        stack(pure({ a: 1, pan: 0.25 }), pure({ a: 1, pan: 0.75 }).fast(2))
          ._sortEventsByPart()
          .firstCycle(),
      );
    });
  });
  describe('_squeezeJoin', () => {
    it('Can squeeze', () => {
      assert.deepStrictEqual(
        sequence('a', ['a', 'a'])
          .fmap((a) => fastcat('b', 'c'))
          ._squeezeJoin()
          .firstCycle(),
        sequence(
          ['b', 'c'],
          [
            ['b', 'c'],
            ['b', 'c'],
          ],
        ).firstCycle(),
      );
    });
  });
  describe('ply', () => {
    it('Can ply(3)', () => {
      assert.deepStrictEqual(
        sequence('a', ['b', 'c']).ply(3).firstCycle(),
        sequence(pure('a').fast(3), [pure('b').fast(3), pure('c').fast(3)]).firstCycle(),
      );
    });
    it('Doesnt drop events in the 9th cycle', () => {
      // fixed with https://github.com/tidalcycles/strudel/commit/72eeaf446e3d5e186d63cc0d2276f0723cde017a
      assert.equal(sequence(1, 2, 3).ply(2).early(8).firstCycle().length, 6);
    });
  });
  describe('striate', () => {
    it('Can striate(2)', () => {
      sameFirst(
        sequence({ sound: 'a' }).striate(2),
        sequence({ sound: 'a', begin: 0, end: 0.5 }, { sound: 'a', begin: 0.5, end: 1 }),
      );
    });
  });
  describe('chop', () => {
    it('Can _chop(2)', () => {
      assert.deepStrictEqual(
        sequence({ sound: 'a' }, { sound: 'b' })._chop(2).firstCycle(),
        sequence(
          { sound: 'a', begin: 0, end: 0.5 },
          { sound: 'a', begin: 0.5, end: 1 },
          { sound: 'b', begin: 0, end: 0.5 },
          { sound: 'b', begin: 0.5, end: 1 },
        ).firstCycle(),
      );
    });
    it('Can chop(2,3)', () => {
      assert.deepStrictEqual(
        pure({ sound: 'a' }).fast(2).chop(2, 3)._sortEventsByPart().firstCycle(),
        sequence(
          [
            { sound: 'a', begin: 0, end: 0.5 },
            { sound: 'a', begin: 0.5, end: 1 },
          ],
          [
            { sound: 'a', begin: 0, end: 1 / 3 },
            { sound: 'a', begin: 1 / 3, end: 2 / 3 },
            { sound: 'a', begin: 2 / 3, end: 1 },
          ],
        )
          ._sortEventsByPart()
          .firstCycle(),
      );
    });
  });
  describe('range2', () => {
    it('Can change the range of a bipolar pattern', () => {
      assert.deepStrictEqual(
        sequence(-1, -0.5, 0, 0.5).range2(1000, 1100).firstCycle(),
        sequence(1000, 1025, 1050, 1075).firstCycle(),
      );
    });
  });
  describe('linger', () => {
    it('Can linger on the first quarter of a cycle', () => {
      assert.deepStrictEqual(
        sequence(0, 1, 2, 3, 4, 5, 6, 7).linger(0.25).firstCycle(),
        sequence(0, 1, 0, 1, 0, 1, 0, 1).firstCycle(),
      );
    });
  });
});
