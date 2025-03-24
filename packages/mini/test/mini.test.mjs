/*
mini.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/test/mini.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { getLeafLocation, getLeafLocations, mini, mini2ast } from '../mini.mjs';
import '@strudel/core/euclid.mjs';
import { Fraction } from '@strudel/core/index.mjs';
import { describe, expect, it } from 'vitest';

describe('mini', () => {
  const minV = (v) => mini(v).sortHapsByPart().firstCycleValues;
  const minS = (v) => mini(v).sortHapsByPart().showFirstCycle;
  it('supports single elements', () => {
    expect(minV('a')).toEqual(['a']);
  });
  it('supports rest', () => {
    expect(minV('~')).toEqual([]);
  });
  it('supports cat', () => {
    expect(minS('a b')).toEqual(['a: 0 - 1/2', 'b: 1/2 - 1']);
    expect(minS('a b c')).toEqual(['a: 0 - 1/3', 'b: 1/3 - 2/3', 'c: 2/3 - 1']);
  });
  it('supports fast', () => {
    expect(minS('a*3 b')).toEqual(minS('[a a a] b'));
  });
  it('supports patterned fast', () => {
    expect(minS('[a*<3 5>]*2')).toEqual(minS('[a a a] [a a a a a]'));
  });
  it('supports slow', () => {
    expect(minS('[a a a]/3 b')).toEqual(minS('a b'));
  });
  it('supports patterned slow', () => {
    expect(minS('[a a a a a a a a]/[2 4]')).toEqual(minS('[a a] a'));
  });
  it('supports patterned fast', () => {
    expect(minS('[a*<3 5>]*2')).toEqual(minS('[a a a] [a a a a a]'));
  });
  it('supports slowcat', () => {
    expect(minV('<a b>')).toEqual(['a']);
  });
  it('supports division', () => {
    expect(minS('a/2')).toEqual(['a: 0 - 2']);
    expect(minS('[c3 d3]/2')).toEqual(['c3: 0 - 1']);
  });
  it('supports multiplication', () => {
    expect(minS('c3*2')).toEqual(['c3: 0 - 1/2', 'c3: 1/2 - 1']);
    expect(minV('[c3 d3]*2')).toEqual(['c3', 'd3', 'c3', 'd3']);
  });
  it('supports brackets', () => {
    expect(minS('c3 [d3 e3]')).toEqual(['c3: 0 - 1/2', 'd3: 1/2 - 3/4', 'e3: 3/4 - 1']);
    expect(minS('c3 [d3 [e3 f3]]')).toEqual(['c3: 0 - 1/2', 'd3: 1/2 - 3/4', 'e3: 3/4 - 7/8', 'f3: 7/8 - 1']);
  });
  it('supports curly brackets', () => {
    expect(minS('{a b, c d e}*3')).toEqual(minS('[a b a b a b, c d e c d e]'));
    expect(minS('{a b, c [d e] f}*3')).toEqual(minS('[a b a b a b, c [d e] f c [d e] f]'));
    expect(minS('{a b c, d e}*2')).toEqual(minS('[a b c a b c, d e d e d e]'));
  });
  it('supports curly brackets with explicit step-per-cycle', () => {
    expect(minS('{a b, c d e}%3')).toEqual(minS('[a b a, c d e]'));
    expect(minS('{a b, c d e}%5')).toEqual(minS('[a b a b a, c d e c d]'));
    expect(minS('{a b, c d e}%6')).toEqual(minS('[a b a b a b, c d e c d e]'));
  });
  it('supports commas', () => {
    expect(minS('c3,e3,g3')).toEqual(['c3: 0 - 1', 'e3: 0 - 1', 'g3: 0 - 1']);
    expect(minS('[c3,e3,g3] f3')).toEqual(['c3: 0 - 1/2', 'e3: 0 - 1/2', 'g3: 0 - 1/2', 'f3: 1/2 - 1']);
  });
  it('supports elongation', () => {
    expect(minS('a@3 b')).toEqual(['a: 0 - 3/4', 'b: 3/4 - 1']);
    expect(minS('a@2 b@3')).toEqual(['a: 0 - 2/5', 'b: 2/5 - 1']);
  });
  it('supports replication', () => {
    expect(minS('a!3 b')).toEqual(['a: 0 - 1/4', 'a: 1/4 - 1/2', 'a: 1/2 - 3/4', 'b: 3/4 - 1']);
    expect(minS('[<a b c>]!3 d')).toEqual(minS('<a b c> <a b c> <a b c> d'));
  });
  it('supports replication via repeated !', () => {
    expect(minS('a ! ! b')).toEqual(['a: 0 - 1/4', 'a: 1/4 - 1/2', 'a: 1/2 - 3/4', 'b: 3/4 - 1']);
    expect(minS('[<a b c>]!! d')).toEqual(minS('<a b c> <a b c> <a b c> d'));
  });
  it('supports euclidean rhythms', () => {
    expect(minS('a(3, 8)')).toEqual(['a: 0 - 1/8', 'a: 3/8 - 1/2', 'a: 3/4 - 7/8']);
  });
  it('supports patterning euclidean rhythms', () => {
    expect(minS('[a(<3 5>, <8 16>)]*2')).toEqual(minS('a(3,8) a(5,16)'));
  });
  it("reproduces Toussaint's example euclidean algorithms", () => {
    const checkEuclid = function (spec, target) {
      expect(minS(`x(${spec[0]},${spec[1]})`)).toEqual(minS(target));
    };
    checkEuclid([1, 2], 'x ~');
    checkEuclid([1, 3], 'x ~ ~');
    checkEuclid([1, 4], 'x ~ ~ ~');
    checkEuclid([4, 12], 'x ~ ~ x ~ ~ x ~ ~ x ~ ~');
    checkEuclid([2, 5], 'x ~ x ~ ~');
    // checkEuclid([3, 4], "x ~ x x"); // Toussaint is wrong..
    checkEuclid([3, 4], 'x x x ~'); // correction
    checkEuclid([3, 5], 'x ~ x ~ x');
    checkEuclid([3, 7], 'x ~ x ~ x ~ ~');
    checkEuclid([3, 8], 'x ~ ~ x ~ ~ x ~');
    checkEuclid([4, 7], 'x ~ x ~ x ~ x');
    checkEuclid([4, 9], 'x ~ x ~ x ~ x ~ ~');
    checkEuclid([4, 11], 'x ~ ~ x ~ ~ x ~ ~ x ~');
    // checkEuclid([5, 6], "x ~ x x x x"); // Toussaint is wrong..
    checkEuclid([5, 6], 'x x x x x ~'); // correction
    checkEuclid([5, 7], 'x ~ x x ~ x x');
    checkEuclid([5, 8], 'x ~ x x ~ x x ~');
    checkEuclid([5, 9], 'x ~ x ~ x ~ x ~ x');
    checkEuclid([5, 11], 'x ~ x ~ x ~ x ~ x ~ ~');
    checkEuclid([5, 12], 'x ~ ~ x ~ x ~ ~ x ~ x ~');
    // checkEuclid([5, 16], "x ~ ~ x ~ ~ x ~ ~ x ~ ~ x ~ ~ ~ ~");  // Toussaint is wrong..
    checkEuclid([5, 16], 'x ~ ~ x ~ ~ x ~ ~ x ~ ~ x ~ ~ ~'); // correction
    // checkEuclid([7, 8], "x ~ x x x x x x"); // Toussaint is wrong..
    checkEuclid([7, 8], 'x x x x x x x ~'); // Correction
    checkEuclid([7, 12], 'x ~ x x ~ x ~ x x ~ x ~');
    checkEuclid([7, 16], 'x ~ ~ x ~ x ~ x ~ ~ x ~ x ~ x ~');
    checkEuclid([9, 16], 'x ~ x x ~ x ~ x ~ x x ~ x ~ x ~');
    checkEuclid([11, 24], 'x ~ ~ x ~ x ~ x ~ x ~ x ~ ~ x ~ x ~ x ~ x ~ x ~');
    checkEuclid([13, 24], 'x ~ x x ~ x ~ x ~ x ~ x ~ x x ~ x ~ x ~ x ~ x ~');
  });
  it('supports the - alias for ~', () => {
    expect(minS('a - b [- c]')).toEqual(minS('a ~ b [~ c]'));
  });
  it('supports the ? operator', () => {
    expect(
      mini('a?')
        .queryArc(0, 20)
        .map((hap) => hap.whole.begin),
    ).toEqual(
      mini('a')
        .degradeBy(0.5)
        .queryArc(0, 20)
        .map((hap) => hap.whole.begin),
    );
  });
  // testing things that involve pseudo-randomness, so there's a probability we could fail by chance.
  // these next few tests work with the current PRNG, and are intended to succeed with p > 0.99 even if the PRNG changes
  //   (as long as the PRNG has a relatively-uniform distribution of values)
  it('supports degradeBy with default of 50%', () => {
    const haps = mini('a?').queryArc(0, 1000);
    expect(459 <= haps.length && haps.length <= 541).toBe(true);
    // 'Number of elements did not fall in 99% confidence interval for binomial with p=0.5',
  });
  it('supports degradeBy with an argument', () => {
    const haps = mini('a?0.8').queryArc(0, 1000);
    expect(haps.length > 0).toBe(true);
    // 'Should have had at least one element when degradeBy was set at 0.8');
    expect(haps.length < 230).toBe(true);
    // 'Had too many cycles remaining after degradeBy 0.8');
  });
  it('supports multiple independent uses of the random choice operator ("|")', () => {
    const numCycles = 1000;
    const values = mini('[a|b] [a|b]')
      .queryArc(0, numCycles)
      .map((e) => e.value);
    const observed = { aa: 0, ab: 0, ba: 0, bb: 0 };
    for (let i = 0; i < values.length; i += 2) {
      const chunk = values.slice(i, i + 2);
      observed[chunk.join('')]++;
    }
    for (const count of Object.values(observed)) {
      // Should fall within 99% confidence interval for binomial with p=0.25.
      expect(215 <= count && count <= 286).toBe(true);
    }
  });
  it('supports the random choice operator ("|") with nesting', () => {
    const numCycles = 900;
    const haps = mini('a | [b | c] | [d | e | f]').queryArc(0, numCycles);
    // Should have about 1/3 a, 1/6 each of b | c, and 1/9 each of d | e | f.
    // Evaluating this distribution with a chi-squared test.
    // Note: this just evaluates the overall distribution, not things like correlation/runs of values
    const observed = haps.reduce((acc, hap) => {
      acc[hap.value] = (acc[hap.value] || 0) + 1;
      return acc;
    }, {});
    const expected = {
      a: numCycles / 3,
      b: numCycles / 6,
      c: numCycles / 6,
      d: numCycles / 9,
      e: numCycles / 9,
      f: numCycles / 9,
    };
    let chisq = -numCycles;
    for (let k in expected) {
      chisq += (observed[k] * observed[k]) / expected[k];
    }
    // 15.086 is the chisq for 5 degrees of freedom at 99%, so for 99% of uniformly-distributed
    //  PRNG, this test should succeed
    expect(chisq <= 15.086).toBe(true);
  });
  it('supports lists', () => {
    expect(minV('a:b c:d:[e:f] g')).toEqual([['a', 'b'], ['c', 'd', ['e', 'f']], 'g']);
  });
  it('supports ranges', () => {
    expect(minV('0 .. 4')).toEqual([0, 1, 2, 3, 4]);
  });
  it('supports patterned ranges', () => {
    expect(minS('[<0 1> .. <2 4>]*2')).toEqual(minS('[0 1 2] [1 2 3 4]'));
  });
  it('supports the . operator', () => {
    expect(minS('a . b c')).toEqual(minS('a [b c]'));
    expect(minS('a . b c . [d e f . g h]')).toEqual(minS('a [b c] [[d e f] [g h]]'));
  });
  it('supports the _ operator', () => {
    expect(minS('a _ b _ _')).toEqual(minS('a@2 b@3'));
  });
  it('_ and @ are almost interchangeable', () => {
    expect(minS('a @ b @ @')).toEqual(minS('a _2 b _3'));
  });
  it('supports ^ step marking', () => {
    expect(mini('a [^b c]')._steps).toEqual(Fraction(4));
    expect(mini('[^b c]!3')._steps).toEqual(Fraction(6));
    expect(mini('[a b c] [d [e f]]')._steps).toEqual(Fraction(2));
    expect(mini('^[a b c] [d [e f]]')._steps).toEqual(Fraction(2));
    expect(mini('[a b c] [d [^e f]]')._steps).toEqual(Fraction(8));
    expect(mini('[a b c] [^d [e f]]')._steps).toEqual(Fraction(4));
    expect(mini('[^a b c] [^d [e f]]')._steps).toEqual(Fraction(12));
    expect(mini('[^a b c] [d [^e f]]')._steps).toEqual(Fraction(24));
    expect(mini('[^a b c d e]')._steps).toEqual(Fraction(5));
  });
});

describe('getLeafLocation', () => {
  it('gets location of leaf nodes', () => {
    const code = '"bd sd"';
    const ast = mini2ast(code);

    const bd = ast.source_[0].source_;
    expect(getLeafLocation(code, bd)).toEqual([1, 3]);

    const sd = ast.source_[1].source_;
    expect(getLeafLocation(code, sd)).toEqual([4, 6]);
  });
});

describe('getLeafLocations', () => {
  it('gets locations of leaf nodes', () => {
    expect(getLeafLocations('"bd sd"')).toEqual([
      [1, 3], // bd columns
      [4, 6], // sd columns
    ]);
    expect(getLeafLocations('"bd*2 [sd cp]"')).toEqual([
      [1, 3], // bd columns
      [7, 9], // sd columns
      [10, 12], // cp columns
      [4, 5], // "2" columns
    ]);
    expect(getLeafLocations('"bd*<2 3>"')).toEqual([
      [1, 3], // bd columns
      [5, 6], // "2" columns
      [7, 8], // "3" columns
    ]);
  });
});
