/*
signal.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/signal.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Hap } from './hap.mjs';
import { Pattern, fastcat, reify, silence, stack } from './pattern.mjs';
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

export const rand = signal(timeToRand);

export const _brandBy = (p) => rand.fmap((x) => x < p);
export const brandBy = (pPat) => reify(pPat).fmap(_brandBy).innerJoin();
export const brand = _brandBy(0.5);

export const _irand = (i) => rand.fmap((x) => Math.trunc(x * i));
export const irand = (ipat) => reify(ipat).fmap(_irand).innerJoin();

export const chooseWith = (pat, xs) => {
  xs = xs.map(reify);
  if (xs.length == 0) {
    return silence;
  }
  return pat
    .range(0, xs.length)
    .fmap((i) => xs[Math.floor(i)])
    .outerJoin();
};

export const choose = (...xs) => chooseWith(rand, xs);

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

export const perlin = perlinWith(time);

Pattern.prototype._degradeByWith = function (withPat, x) {
  return this.fmap((a) => (_) => a).appLeft(withPat._filterValues((v) => v > x));
};

Pattern.prototype._degradeBy = function (x) {
  return this._degradeByWith(rand, x);
};

Pattern.prototype.degrade = function () {
  return this._degradeBy(0.5);
};

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

Pattern.prototype.sometimesBy = function (patx, func) {
  const pat = this;
  return reify(patx)
    .fmap((x) => pat._sometimesBy(x, func))
    .innerJoin();
};

Pattern.prototype._sometimesByPre = function (x, func) {
  return stack(this._degradeBy(x), func(this).undegradeBy(1 - x));
};

Pattern.prototype.sometimesByPre = function (patx, func) {
  const pat = this;
  return reify(patx)
    .fmap((x) => pat._sometimesByPre(x, func))
    .innerJoin();
};

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

Pattern.prototype.someCyclesBy = function (patx, func) {
  const pat = this;
  return reify(patx)
    .fmap((x) => pat._someCyclesBy(x, func))
    .innerJoin();
};

Pattern.prototype.someCycles = function (func) {
  return this._someCyclesBy(0.5, func);
};

Pattern.prototype.often = function (func) {
  return this.sometimesBy(0.75, func);
};

Pattern.prototype.rarely = function (func) {
  return this.sometimesBy(0.25, func);
};

Pattern.prototype.almostNever = function (func) {
  return this.sometimesBy(0.1, func);
};

Pattern.prototype.almostAlways = function (func) {
  return this.sometimesBy(0.9, func);
};

Pattern.prototype.never = function (func) {
  return this;
};

Pattern.prototype.always = function (func) {
  return func(this);
};

Pattern.prototype.patternified.push('degradeBy', 'undegradeBy');
