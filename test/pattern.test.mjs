import Fraction from 'fraction.js'

import { strict as assert } from 'assert';

import {TimeSpan, Hap, Pattern, pure} from "../js/strudel.mjs";

describe('TimeSpan', function() {
  describe('equal()', function() {
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
    describe('has_onset()', function() {
      it('True if part includes onset from whole', function() {
        assert.equal(new Hap(new TimeSpan(0,1), new TimeSpan(0,1), "thing").has_onset(), true);
      });
    });
  });
  
describe('Pattern', function() {
  describe('pure', function () {
    it('Can make a pattern', function() {
      assert.equal(pure("hello").query(new TimeSpan(Fraction(0.5), Fraction(2.5))).length, 3)
    })
  })
})