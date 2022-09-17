/*
signal.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/signal.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Hap } from './hap.mjs';
import { Pattern, fastcat, reify, silence, stack, isPattern } from './pattern.mjs';
import Fraction from './fraction.mjs';
import { id } from './util.mjs';

export function steady(value) {
  // A continuous value
  return new Pattern((state) => [new Hap(undefined, state.span, value)]);
}

export const signal = (func) => {
  const query = (state) => [new Hap(undefined, state.span, func(state.span.midpoint()))];
  return new Pattern(query);
};

export const isaw = signal((t) => 1 - (t % 1));
export const isaw2 = isaw._toBipolar();

/**
 *  A sawtooth signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * "c3 [eb3,g3] g2 [g3,bb3]".legato(saw.slow(4))
 * @example
 * saw.range(0,8).segment(8).scale('C major').slow(4)
 *
 */
export const saw = signal((t) => t % 1);
export const saw2 = saw._toBipolar();

export const sine2 = signal((t) => Math.sin(Math.PI * 2 * t));

/**
 *  A sine signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * sine.segment(16).range(0,15).slow(2).scale('C minor')
 *
 */
export const sine = sine2._fromBipolar();

/**
 *  A cosine signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * stack(sine,cosine).segment(16).range(0,15).slow(2).scale('C minor')
 *
 */
export const cosine = sine._early(Fraction(1).div(4));
export const cosine2 = sine2._early(Fraction(1).div(4));

/**
 *  A square signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * square.segment(2).range(0,7).scale('C minor')
 *
 */
export const square = signal((t) => Math.floor((t * 2) % 2));
export const square2 = square._toBipolar();

/**
 *  A triangle signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * triangle.segment(2).range(0,7).scale('C minor')
 *
 */
export const tri = fastcat(isaw, saw);
export const tri2 = fastcat(isaw2, saw2);

export const time = signal(id);

// random signals

const xorwise = (x) => {
  const a = (x << 13) ^ x;
  const b = (a >> 17) ^ a;
  return (b << 5) ^ b;
};

// stretch 300 cycles over the range of [0,2**29 == 536870912) then apply the xorshift algorithm
const _frac = (x) => x - Math.trunc(x);

const timeToIntSeed = (x) => xorwise(Math.trunc(_frac(x / 300) * 536870912));

const intSeedToRand = (x) => (x % 536870912) / 536870912;

const timeToRand = (x) => Math.abs(intSeedToRand(timeToIntSeed(x)));

const timeToRandsPrime = (seed, n) => {
  const result = [];
  for (let i = 0; i < n; ++n) {
    result.push(intSeedToRand(seed));
    seed = xorwise(seed);
  }
  return result;
};

const timeToRands = (t, n) => timeToRandsPrime(timeToIntSeed(t), n);

/**
 *
 */

/**
 * A continuous pattern of random numbers, between 0 and 1.
 *
 * @name rand
 * @example
 * // randomly change the cutoff
 * s("bd sd,hh*4").cutoff(rand.range(500,2000)).out()
 *
 */
export const rand = signal(timeToRand);
/**
 * A continuous pattern of random numbers, between -1 and 1
 */
export const rand2 = rand._toBipolar();

export const _brandBy = (p) => rand.fmap((x) => x < p);
export const brandBy = (pPat) => reify(pPat).fmap(_brandBy).innerJoin();
export const brand = _brandBy(0.5);

export const _irand = (i) => rand.fmap((x) => Math.trunc(x * i));

/**
 * A continuous pattern of random integers, between 0 and n-1.
 *
 * @name irand
 * @param {number} n max value (exclusive)
 * @example
 * // randomly select scale notes from 0 - 7 (= C to C)
 * irand(8).struct("x(3,8)").scale('C minor').note().out()
 *
 */
export const irand = (ipat) => reify(ipat).fmap(_irand).innerJoin();

export const __chooseWith = (pat, xs) => {
  xs = xs.map(reify);
  if (xs.length == 0) {
    return silence;
  }
  return pat.range(0, xs.length).fmap((i) => xs[Math.floor(i)]);
};
/**
 * Choose from the list of values (or patterns of values) using the given
 * pattern of numbers, which should be in the range of 0..1
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */
export const chooseWith = (pat, xs) => {
  return __chooseWith(pat, xs).outerJoin();
};

/**
 * As with {chooseWith}, but the structure comes from the chosen values, rather
 * than the pattern you're using to choose with.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */
export const chooseInWith = (pat, xs) => {
  return __chooseWith(pat, xs).innerJoin();
};

/**
 * Chooses randomly from the given list of elements.
 * @param  {...any} xs values / patterns to choose from.
 * @returns {Pattern} - a continuous pattern.
 */
export const choose = (...xs) => chooseWith(rand, xs);

/**
 * Chooses from the given list of values (or patterns of values), according
 * to the pattern that the method is called on. The pattern should be in
 * the range 0 .. 1.
 * @param  {...any} xs
 * @returns {Pattern}
 */
Pattern.prototype.choose = function (...xs) {
  return chooseWith(this, xs);
};

/**
 * As with choose, but the pattern that this method is called on should be
 * in the range -1 .. 1
 * @param  {...any} xs
 * @returns {Pattern}
 */
Pattern.prototype.choose2 = function (...xs) {
  return chooseWith(this._fromBipolar(), xs);
};

/**
 * Picks one of the elements at random each cycle.
 * @returns {Pattern}
 * @example
 * chooseCycles("bd", "hh", "sd").s().fast(4).out()
 * @example
 * "bd | hh | sd".s().fast(4).out()
 */
export const chooseCycles = (...xs) => chooseInWith(rand.segment(1), xs);

export const randcat = chooseCycles;

const _wchooseWith = function (pat, ...pairs) {
  const values = pairs.map((pair) => reify(pair[0]));
  const weights = [];
  let accum = 0;
  for (const pair of pairs) {
    accum += pair[1];
    weights.push(accum);
  }
  const total = accum;
  const match = function (r) {
    const find = r * total;
    return values[weights.findIndex((x) => x > find, weights)];
  };
  return pat.fmap(match);
};

const wchooseWith = (...args) => _wchooseWith(...args).outerJoin();

export const wchoose = (...pairs) => wchooseWith(rand, ...pairs);

export const wchooseCycles = (...pairs) => _wchooseWith(rand, ...pairs).innerJoin();

export const perlinWith = (pat) => {
  const pata = pat.fmap(Math.floor);
  const patb = pat.fmap((t) => Math.floor(t) + 1);
  const smootherStep = (x) => 6.0 * x ** 5 - 15.0 * x ** 4 + 10.0 * x ** 3;
  const interp = (x) => (a) => (b) => a + smootherStep(x) * (b - a);
  return pat.sub(pata).fmap(interp).appBoth(pata.fmap(timeToRand)).appBoth(patb.fmap(timeToRand));
};

/**
 * Generates a continuous pattern of [perlin noise](https://en.wikipedia.org/wiki/Perlin_noise), in the range 0..1.
 *
 * @name perlin
 * @example
 * // randomly change the cutoff
 * s("bd sd,hh*4").cutoff(perlin.range(500,2000)).out()
 *
 */
export const perlin = perlinWith(time);

Pattern.prototype._degradeByWith = function (withPat, x) {
  return this.fmap((a) => (_) => a).appLeft(withPat._filterValues((v) => v > x));
};

/**
 * Randomly removes events from the pattern by a given amount.
 * 0 = 0% chance of removal
 * 1 = 100% chance of removal
 *
 * @name degradeBy
 * @memberof Pattern
 * @param {number} amount - a number between 0 and 1
 * @returns Pattern
 * @example
 * s("hh*8").degradeBy(0.2).out()
 * @example
 * s("[hh?0.2]*8").out()
 */
Pattern.prototype._degradeBy = function (x) {
  return this._degradeByWith(rand, x);
};

/**
 *
 * Randomly removes 50% of events from the pattern. Shorthand for `.degradeBy(0.5)`
 *
 * @name degrade
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").degrade().out()
 * @example
 * s("[hh?]*8").out()
 */
Pattern.prototype.degrade = function () {
  return this._degradeBy(0.5);
};

/**
 * Inverse of {@link Pattern#degradeBy}: Randomly removes events from the pattern by a given amount.
 * 0 = 100% chance of removal
 * 1 = 0% chance of removal
 * Events that would be removed by degradeBy are let through by undegradeBy and vice versa (see second example).
 *
 * @name undegradeBy
 * @memberof Pattern
 * @param {number} amount - a number between 0 and 1
 * @returns Pattern
 * @example
 * s("hh*8").undegradeBy(0.2).out()
 */
Pattern.prototype._undegradeBy = function (x) {
  return this._degradeByWith(
    rand.fmap((r) => 1 - r),
    x,
  );
};

Pattern.prototype.undegrade = function () {
  return this._undegradeBy(0.5);
};

Pattern.prototype._sometimesBy = function (x, func) {
  return stack(this._degradeBy(x), func(this._undegradeBy(1 - x)));
};

// https://github.com/tidalcycles/strudel/discussions/198
/* Pattern.prototype._sometimesBy = function (x, other) {
  other = typeof other === 'function' ? other(this._undegradeBy(1 - x)) : reify(other)._undegradeBy(1 - x);
  return stack(this._degradeBy(x), other);
}; */

/**
 *
 * Randomly applies the given function by the given probability.
 * Similar to {@link Pattern#someCyclesBy}
 *
 * @name sometimesBy
 * @memberof Pattern
 * @param {number | Pattern} probability - a number between 0 and 1
 * @param {function} function - the transformation to apply
 * @returns Pattern
 * @example
 * s("hh(3,8)").sometimesBy(.4, x=>x.speed("0.5")).out()
 */
Pattern.prototype.sometimesBy = function (patx, func) {
  const pat = this;
  return reify(patx)
    .fmap((x) => pat._sometimesBy(x, func))
    .innerJoin();
};

// why does this exist? it is identical to sometimesBy
Pattern.prototype._sometimesByPre = function (x, func) {
  return stack(this._degradeBy(x), func(this).undegradeBy(1 - x));
};

Pattern.prototype.sometimesByPre = function (patx, func) {
  const pat = this;
  return reify(patx)
    .fmap((x) => pat._sometimesByPre(x, func))
    .innerJoin();
};

/**
 *
 * Applies the given function with a 50% chance
 *
 * @name sometimes
 * @memberof Pattern
 * @param {function} function - the transformation to apply
 * @returns Pattern
 * @example
 * s("hh*4").sometimes(x=>x.speed("0.5")).out()
 */
Pattern.prototype.sometimes = function (func) {
  return this._sometimesBy(0.5, func);
};

Pattern.prototype.sometimesPre = function (func) {
  return this._sometimesByPre(0.5, func);
};

Pattern.prototype._someCyclesBy = function (x, func) {
  return stack(
    this._degradeByWith(rand._segment(1), x),
    func(this._degradeByWith(rand.fmap((r) => 1 - r)._segment(1), 1 - x)),
  );
};

/**
 *
 * Randomly applies the given function by the given probability on a cycle by cycle basis.
 * Similar to {@link Pattern#sometimesBy}
 *
 * @name someCyclesBy
 * @memberof Pattern
 * @param {number | Pattern} probability - a number between 0 and 1
 * @param {function} function - the transformation to apply
 * @returns Pattern
 * @example
 * s("hh(3,8)").someCyclesBy(.3, x=>x.speed("0.5")).out()
 */
Pattern.prototype.someCyclesBy = function (patx, func) {
  const pat = this;
  return reify(patx)
    .fmap((x) => pat._someCyclesBy(x, func))
    .innerJoin();
};

/**
 *
 * Shorthand for `.someCyclesBy(0.5, fn)`
 *
 * @name someCycles
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh(3,8)").someCycles(x=>x.speed("0.5")).out()
 */
Pattern.prototype.someCycles = function (func) {
  return this._someCyclesBy(0.5, func);
};

/**
 *
 * Shorthand for `.sometimesBy(0.75, fn)`
 *
 * @name often
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").often(x=>x.speed("0.5")).out()
 */
Pattern.prototype.often = function (func) {
  return this.sometimesBy(0.75, func);
};

/**
 *
 * Shorthand for `.sometimesBy(0.25, fn)`
 *
 * @name rarely
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").rarely(x=>x.speed("0.5")).out()
 */
Pattern.prototype.rarely = function (func) {
  return this.sometimesBy(0.25, func);
};

/**
 *
 * Shorthand for `.sometimesBy(0.1, fn)`
 *
 * @name almostNever
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").almostNever(x=>x.speed("0.5")).out()
 */
Pattern.prototype.almostNever = function (func) {
  return this.sometimesBy(0.1, func);
};

/**
 *
 * Shorthand for `.sometimesBy(0.9, fn)`
 *
 * @name almostAlways
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").almostAlways(x=>x.speed("0.5")).out()
 */
Pattern.prototype.almostAlways = function (func) {
  return this.sometimesBy(0.9, func);
};

/**
 *
 * Shorthand for `.sometimesBy(0, fn)` (never calls fn)
 *
 * @name never
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").never(x=>x.speed("0.5")).out()
 */
Pattern.prototype.never = function (func) {
  return this;
};

/**
 *
 * Shorthand for `.sometimesBy(1, fn)` (always calls fn)
 *
 * @name always
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").always(x=>x.speed("0.5")).out()
 */
Pattern.prototype.always = function (func) {
  return func(this);
};

Pattern.prototype.patternified.push('degradeBy', 'undegradeBy');
