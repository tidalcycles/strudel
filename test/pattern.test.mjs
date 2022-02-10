import Fraction from 'fraction.js'

import { strict as assert } from 'assert';

import {TimeSpan, Hap, Pattern, pure, stack, fastcat, slowcat, cat, sequence, polyrhythm, silence, fast, timeCat,add,sub,mul,div} from "../strudel.mjs";
//import { Time } from 'tone';
import pkg from 'tone';
const { Time } = pkg;

const ts = (begin, end) => new TimeSpan(Fraction(begin), Fraction(end));
const hap = (whole, part, value) => new Hap(whole, part, value)

describe('TimeSpan', function() {
  describe('equals()', function() {
    it('Should be equal to the same value', function() {
      assert.equal((new TimeSpan(0,4)).equals(new TimeSpan(0,4)), true);
    });
  });
  describe('splitCycles', function() {
    it('Should split two cycles into two', function() {
      assert.equal(new TimeSpan(Fraction(0),Fraction(2)).spanCycles.length, 2)
    })
  })
  describe('intersection_e', function () {
  var a = new TimeSpan(Fraction(0), Fraction(2))
  var b = new TimeSpan(Fraction(1), Fraction(3))
  var c = new TimeSpan(Fraction(1), Fraction(2))
  var d = new TimeSpan(Fraction(1), Fraction(2))
  it('Should create an intersection', function () {
      assert.equal(a.intersection_e(b).equals(c), true)
    })
  })
});

describe('Hap', function() {
    describe('hasOnset()', function() {
      it('True if part includes onset from whole', function() {
        assert.equal(new Hap(new TimeSpan(0,1), new TimeSpan(0,1), "thing").hasOnset(), true);
      });
    });
    var a = new Hap(new TimeSpan(Fraction(0), Fraction(0.5)), new TimeSpan(Fraction(0), Fraction(0.5)), "a")
    var b = new Hap(new TimeSpan(Fraction(0), Fraction(0.5)), new TimeSpan(Fraction(0), Fraction(0.5)), "b")
    var c = new Hap(new TimeSpan(Fraction(0), Fraction(0.25)), new TimeSpan(Fraction(0), Fraction(0.5)), "c")
    var d = new Hap(undefined, new TimeSpan(Fraction(0), Fraction(0.5)), "d")
    var e = new Hap(undefined, new TimeSpan(Fraction(0), Fraction(0.5)), "e")
    describe('spanEquals', function() {
      it('True if two haps have the same whole and part', function() {
        assert.equal(a.spanEquals(b), true)
      })
      it('False if two haps don\'t the same whole and part', function() {
        assert.equal(a.spanEquals(c), false)
      })
      it('True if two haps have the same part and undefined wholes', function() {
        assert.equal(d.spanEquals(e), true)
      })
    })
  });
  
describe('Pattern', function() {
  describe('pure', function () {
    it('Can make a pattern', function() {
      assert.equal(pure("hello").query(new TimeSpan(Fraction(0.5), Fraction(2.5))).length, 3)
    })
  })
  describe('fmap()', function () {
    it('Can add things', function () {
      assert.equal(pure(3).fmap(x => x + 4).firstCycle[0].value, 7)
    })
  })
  describe('add()', function () {
    it('Can add things', function() {
      assert.equal(pure(3).add(pure(4)).query(new TimeSpan(Fraction(0), Fraction(1)))[0].value, 7)
    })
  })
  describe('sub()', function () {
    it('Can subtract things', function() {
      assert.equal(pure(3).sub(pure(4)).query(new TimeSpan(Fraction(0), Fraction(1)))[0].value, -1)
    })
  })
  describe('union()', function () {
    it('Can union things', function () {
      assert.deepStrictEqual(pure({a: 4, b: 6}).union(pure({c: 7})).firstCycle[0].value, {a: 4, b: 6, c: 7})
    })
  })
  describe('stack()', function () {
    it('Can stack things', function () {
      assert.deepStrictEqual(stack(pure("a"), pure("b"), pure("c")).firstCycle.map(h => h.value), ["a", "b", "c"])
    })
  })
  describe('_fast()', function () {
    it('Makes things faster', function () {
      assert.equal(pure("a")._fast(2).firstCycle.length, 2)
    })
  })
  describe('_fastGap()', function () {
    it('Makes things faster, with a gap', function () {
      assert.deepStrictEqual(
        sequence("a", "b", "c")._fastGap(2).firstCycle,
        sequence(["a","b","c"], silence).firstCycle
      )
      assert.deepStrictEqual(
        sequence("a", "b", "c")._fastGap(3).firstCycle,
        sequence(["a","b","c"], silence, silence).firstCycle
      )
    })
    it('Makes things faster, with a gap, when speeded up further', function () {
      assert.deepStrictEqual(
        sequence("a", "b", "c")._fastGap(2).fast(2).firstCycle,
        sequence(["a","b","c"], silence, ["a","b","c"], silence).firstCycle
      )
    })
  })
  describe('_compressSpan()', function () {
    it('Can squash cycles of a pattern into a given timespan', function () {
      assert.deepStrictEqual(
        pure("a")._compressSpan(new TimeSpan(0.25, 0.5)).firstCycle,
        sequence(silence, "a", silence, silence).firstCycle
      )
    })
  })
  describe('fast()', function () {
    it('Makes things faster', function () {
      assert.equal(pure("a").fast(2).firstCycle.length, 2)
    })
    it('Makes things faster, with a pattern of factors', function () {
      assert.equal(pure("a").fast(sequence(1,4)).firstCycle.length, 3)
      // .fast(sequence(1,silence) is a quick hack to cut an event in two..
      assert.deepStrictEqual(pure("a").fast(sequence(1,4)).firstCycle, stack(pure("a").fast(sequence(1,silence)), sequence(silence, ["a","a"])).firstCycle)
    })
    it('defaults to accepting sequences', function () {
      assert.deepStrictEqual(
        sequence(1,2,3).fast(sequence(1.5,2)).firstCycle,
        sequence(1,2,3).fast(1.5,2).firstCycle
      )
    })
    it("works as a static function", function () {
      assert.deepStrictEqual(
        sequence(1,2,3).fast(1,2).firstCycle,
        fast(sequence(1,2), sequence(1,2,3)).firstCycle
      )
    })
    it("works as a curried static function", function () {
      assert.deepStrictEqual(
        sequence(1,2,3).fast(1,2).firstCycle,
        fast(sequence(1,2))(sequence(1,2,3)).firstCycle
      )
    })
  })
  describe('_slow()', function () {
    it('Makes things slower', function () {
      assert.deepStrictEqual(pure("a")._slow(2).firstCycle[0], new Hap(new TimeSpan(Fraction(0),Fraction(2)), new TimeSpan(Fraction(0), Fraction(1)), "a"))

      const pat = sequence(pure('c3'), pure('eb3')._slow(2)); // => try mini('c3 eb3/2') in repl
      assert.deepStrictEqual(
        pat.query(ts(0,1))[1],
        hap(ts(0.5,1.5), ts(1/2,1), "eb3")
      )
      // the following test fails
      /* assert.deepStrictEqual(
        pat.query(ts(1,2))[1], undefined
      ) */
      // expecting [c3 eb3] [c3 ~]
      // what happens [c3 eb3] [c3 eb3]
      // notable examples:
      // mini('[c3 g3]/2 eb3') always plays [c3 eb3]
      // mini('eb3 [c3 g3]/2 ') always plays [c3 g3]
    })
  })  
  describe('_filterValues()', function () {
    it('Filters true', function () {
      assert.equal(pure(true)._filterValues(x => x).firstCycle.length, 1)
    })
  })
  describe('when()', function () {
    it('Always faster', function () {
      assert.equal(pure("a").when(pure(true), x => x._fast(2)).firstCycle.length, 2)
    })
    it('Never faster', function () {
      assert.equal(pure("a").when(pure(false), x => x._fast(2)).firstCycle.length, 1)
    })
  })
  describe('fastcat()', function () {
    it('Can concatenate two things', function () {
      assert.deepStrictEqual(fastcat(pure("a"), pure("b")).firstCycle.map(x => x.value), ["a", "b"])
    })
  })
  describe('slowcat()', function () {
    it('Can concatenate things slowly', function () {
      assert.deepStrictEqual(slowcat("a", "b").firstCycle.map(x => x.value), ["a"])
      assert.deepStrictEqual(slowcat("a", "b")._early(1).firstCycle.map(x => x.value), ["b"])
      assert.deepStrictEqual(slowcat("a", slowcat("b", "c"))._early(1).firstCycle.map(x => x.value), ["b"])
      assert.deepStrictEqual(slowcat("a", slowcat("b", "c"))._early(3).firstCycle.map(x => x.value), ["c"])
    })
  })
  describe('rev()', function () {
    it('Can reverse things', function () {
      assert.deepStrictEqual(fastcat("a","b","c").rev().firstCycle.sort((a,b) => a.part.begin.sub(b.part.begin)).map(a => a.value), ["c", "b","a"])
    })
  })
  describe('sequence()', () => {
    it('Can work like fastcat', () => {
      assert.deepStrictEqual(sequence(1,2,3).firstCycle, fastcat(1,2,3).firstCycle)
    })
  })
  describe('polyrhythm()', () => {
    it('Can layer up cycles', () => {
      assert.deepStrictEqual(
        polyrhythm(["a","b"],["c"]).firstCycle,
        stack(fastcat(pure("a"),pure("b")),pure("c")).firstCycle
      )
    })
  })
  describe('every()', () => {
    it('Can apply a function every 3rd time', () => {
      assert.deepStrictEqual(
        pure("a").every(3, x => x._fast(2))._fast(3).firstCycle,
        sequence(sequence("a", "a"), "a", "a").firstCycle
      )
    })
    it("works with currying", () => {
      assert.deepStrictEqual(
        pure("a").every(3, fast(2))._fast(3).firstCycle,
        sequence(sequence("a", "a"), "a", "a").firstCycle
      )
      assert.deepStrictEqual(
        sequence(3,4,5).every(3, add(3)).fast(5).firstCycle,
        sequence(6,7,8,3,4,5,3,4,5,6,7,8,3,4,5).firstCycle
      )
      assert.deepStrictEqual(
        sequence(3,4,5).every(2, sub(1)).fast(5).firstCycle,
        sequence(2,3,4,3,4,5,2,3,4,3,4,5,2,3,4).firstCycle
      )
      assert.deepStrictEqual(
        sequence(3,4,5).every(3, add(3)).every(2, sub(1)).fast(2).firstCycle,
        sequence(5,6,7,3,4,5).firstCycle
      )
    })
  })
  describe('timeCat()', function() {
    it('Can concatenate patterns with different relative durations', function() {
      assert.deepStrictEqual(
        sequence("a", ["a", "a"]).firstCycle,
        timeCat([1,"a"], [0.5, "a"], [0.5, "a"]).firstCycle
      )
    })
  })
})
