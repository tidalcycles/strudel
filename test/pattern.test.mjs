import Fraction from 'fraction.js'

import { strict as assert } from 'assert';

import {TimeSpan, Hap, Pattern, pure} from "../js/strudel.mjs";

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
})