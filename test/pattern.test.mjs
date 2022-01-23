
import 'fraction.js';

import { strict as assert } from 'assert';

import {TimeSpan, Hap} from "../js/strudel.mjs";

describe('TimeSpan', function() {
  describe('equal()', function() {
    it('Should be equal to the same value', function() {
      assert.equal((new TimeSpan(0,4)).equals(new TimeSpan(0,4)), true);
    });
  });
});

describe('Hap', function() {
    describe('has_onset()', function() {
      it('True if part includes onset from whole', function() {
        assert.equal(new Hap(new TimeSpan(0,1), new TimeSpan(0,1), "thing").has_onset(), true);
      });
    });
  });
  