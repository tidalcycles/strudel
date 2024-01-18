/*
signal.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/signal.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Hap } from './hap.mjs';
import { Pattern, fastcat, reify, silence, stack, register } from './pattern.mjs';
import Fraction from './fraction.mjs';
import { id, _mod, clamp, objectMap } from './util.mjs';

export function steady(value) {
  // A continuous value
  return new Pattern((state) => [new Hap(undefined, state.span, value)]);
}

export const signal = (func) => {
  const query = (state) => [new Hap(undefined, state.span, func(state.span.midpoint()))];
  return new Pattern(query);
};

export const isaw = signal((t) => 1 - (t % 1));
export const isaw2 = isaw.toBipolar();

/**
 *  A sawtooth signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * "c3 [eb3,g3] g2 [g3,bb3]".note().clip(saw.slow(4))
 * @example
 * saw.range(0,8).segment(8).scale('C major').slow(4).note()
 *
 */
export const saw = signal((t) => t % 1);
export const saw2 = saw.toBipolar();

export const sine2 = signal((t) => Math.sin(Math.PI * 2 * t));

/**
 *  A sine signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * sine.segment(16).range(0,15).slow(2).scale('C minor').note()
 *
 */
export const sine = sine2.fromBipolar();

/**
 *  A cosine signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * stack(sine,cosine).segment(16).range(0,15).slow(2).scale('C minor').note()
 *
 */
export const cosine = sine._early(Fraction(1).div(4));
export const cosine2 = sine2._early(Fraction(1).div(4));

/**
 *  A square signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * square.segment(2).range(0,7).scale('C minor').note()
 *
 */
export const square = signal((t) => Math.floor((t * 2) % 2));
export const square2 = square.toBipolar();

/**
 *  A triangle signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * tri.segment(8).range(0,7).scale('C minor').note()
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
  // eslint-disable-next-line
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
 * A discrete pattern of numbers from 0 to n-1
 * @example
 * run(4).scale('C4 major').note()
 * // "0 1 2 3".scale('C4 major').note()
 */
export const run = (n) => saw.range(0, n).floor().segment(n);

/**
 * A continuous pattern of random numbers, between 0 and 1.
 *
 * @name rand
 * @example
 * // randomly change the cutoff
 * s("bd sd,hh*4").cutoff(rand.range(500,2000))
 *
 */
export const rand = signal(timeToRand);
/**
 * A continuous pattern of random numbers, between -1 and 1
 */
export const rand2 = rand.toBipolar();

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
 * irand(8).struct("x(3,8)").scale('C minor').note()
 *
 */
export const irand = (ipat) => reify(ipat).fmap(_irand).innerJoin();

const _pick = function (lookup, pat, modulo = true) {
  const array = Array.isArray(lookup);
  const len = Object.keys(lookup).length;

  lookup = objectMap(lookup, reify);

  if (len === 0) {
    return silence;
  }
  return pat.fmap((i) => {
    let key = i;
    if (array) {
      key = modulo ? Math.round(key) % len : clamp(Math.round(key), 0, lookup.length - 1);
    }
    return lookup[key];
  });
};

/** * Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
 * Similar to `inhabit`, but maintains the structure of the original patterns.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 * @example
 * note("<0 1 2!2 3>".pick(["g a", "e f", "f g f g" , "g c d"]))
 * @example
 * sound("<0 1 [2,0]>".pick(["bd sd", "cp cp", "hh hh"]))
 * @example
 * sound("<0!2 [0,1] 1>".pick(["bd(3,8)", "sd sd"]))
 * @example
 * s("<a!2 [a,b] b>".pick({a: "bd(3,8)", b: "sd sd"}))
 */

export const pick = register('pick', function (lookup, pat) {
  return _pick(lookup, pat, false).innerJoin();
});

/** * The same as `pick`, but if you pick a number greater than the size of the list,
 * it wraps around, rather than sticking at the maximum value.
 * For example, if you pick the fifth pattern of a list of three, you'll get the
 * second one.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */

export const pickmod = register('pickmod', function (lookup, pat) {
  return _pick(lookup, pat, true).innerJoin();
});

/**
/** * Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
 * Similar to `pick`, but cycles are squeezed into the target ('inhabited') pattern.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 * @example
 * "<a b [a,b]>".inhabit({a: s("bd(3,8)"), 
                          b: s("cp sd")
                         })
 * @example
 * s("a@2 [a b] a".inhabit({a: "bd(3,8)", b: "sd sd"})).slow(4)
 */
export const inhabit = register('inhabit', function (lookup, pat) {
  return _pick(lookup, pat, true).squeezeJoin();
});

/** * The same as `inhabit`, but if you pick a number greater than the size of the list,
 * it wraps around, rather than sticking at the maximum value.
 * For example, if you pick the fifth pattern of a list of three, you'll get the
 * second one.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */

export const inhabitmod = register('inhabit', function (lookup, pat) {
  return _pick(lookup, pat, false).squeezeJoin();
});

/**
 * Pick from the list of values (or patterns of values) via the index using the given
 * pattern of integers. The selected pattern will be compressed to fit the duration of the selecting event
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 * @example
 * note(squeeze("<0@2 [1!2] 2>", ["g a", "f g f g" , "g a c d"]))
 */

export const squeeze = (pat, xs) => {
  xs = xs.map(reify);
  if (xs.length == 0) {
    return silence;
  }
  return pat
    .fmap((i) => {
      const key = _mod(Math.round(i), xs.length);
      return xs[key];
    })
    .squeezeJoin();
};

export const __chooseWith = (pat, xs) => {
  xs = xs.map(reify);
  if (xs.length == 0) {
    return silence;
  }

  return pat.range(0, xs.length).fmap((i) => {
    const key = Math.min(Math.max(Math.floor(i), 0), xs.length - 1);
    return xs[key];
  });
};
/**
 * Choose from the list of values (or patterns of values) using the given
 * pattern of numbers, which should be in the range of 0..1
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 * @example
 * note("c2 g2!2 d2 f1").s(chooseWith(sine.fast(2), ["sawtooth", "triangle", "bd:6"]))
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
  return chooseWith(this.fromBipolar(), xs);
};

/**
 * Picks one of the elements at random each cycle.
 * @returns {Pattern}
 * @example
 * chooseCycles("bd", "hh", "sd").s().fast(4)
 * @example
 * "bd | hh | sd".s().fast(4)
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

// this function expects pat to be a pattern of floats...
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
 * s("bd sd,hh*4").cutoff(perlin.range(500,2000))
 *
 */
export const perlin = perlinWith(time.fmap((v) => Number(v)));

export const degradeByWith = register('degradeByWith', (withPat, x, pat) =>
  pat.fmap((a) => (_) => a).appLeft(withPat.filterValues((v) => v > x)),
);

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
 * s("hh*8").degradeBy(0.2)
 * @example
 * s("[hh?0.2]*8")
 */
export const degradeBy = register('degradeBy', function (x, pat) {
  return pat._degradeByWith(rand, x);
});

/**
 *
 * Randomly removes 50% of events from the pattern. Shorthand for `.degradeBy(0.5)`
 *
 * @name degrade
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").degrade()
 * @example
 * s("[hh?]*8")
 */
export const degrade = register('degrade', (pat) => pat._degradeBy(0.5));

/**
 * Inverse of `degradeBy`: Randomly removes events from the pattern by a given amount.
 * 0 = 100% chance of removal
 * 1 = 0% chance of removal
 * Events that would be removed by degradeBy are let through by undegradeBy and vice versa (see second example).
 *
 * @name undegradeBy
 * @memberof Pattern
 * @param {number} amount - a number between 0 and 1
 * @returns Pattern
 * @example
 * s("hh*8").undegradeBy(0.2)
 */
export const undegradeBy = register('undegradeBy', function (x, pat) {
  return pat._degradeByWith(
    rand.fmap((r) => 1 - r),
    x,
  );
});

export const undegrade = register('undegrade', (pat) => pat._undegradeBy(0.5));

/**
 *
 * Randomly applies the given function by the given probability.
 * Similar to `someCyclesBy`
 *
 * @name sometimesBy
 * @memberof Pattern
 * @param {number | Pattern} probability - a number between 0 and 1
 * @param {function} function - the transformation to apply
 * @returns Pattern
 * @example
 * s("hh(3,8)").sometimesBy(.4, x=>x.speed("0.5"))
 */

export const sometimesBy = register('sometimesBy', function (patx, func, pat) {
  return reify(patx)
    .fmap((x) => stack(pat._degradeBy(x), func(pat._undegradeBy(1 - x))))
    .innerJoin();
});

/**
 *
 * Applies the given function with a 50% chance
 *
 * @name sometimes
 * @memberof Pattern
 * @param {function} function - the transformation to apply
 * @returns Pattern
 * @example
 * s("hh*4").sometimes(x=>x.speed("0.5"))
 */
export const sometimes = register('sometimes', function (func, pat) {
  return pat._sometimesBy(0.5, func);
});

/**
 *
 * Randomly applies the given function by the given probability on a cycle by cycle basis.
 * Similar to `sometimesBy`
 *
 * @name someCyclesBy
 * @memberof Pattern
 * @param {number | Pattern} probability - a number between 0 and 1
 * @param {function} function - the transformation to apply
 * @returns Pattern
 * @example
 * s("hh(3,8)").someCyclesBy(.3, x=>x.speed("0.5"))
 */

export const someCyclesBy = register('someCyclesBy', function (patx, func, pat) {
  return reify(patx)
    .fmap((x) =>
      stack(
        pat._degradeByWith(rand._segment(1), x),
        func(pat._degradeByWith(rand.fmap((r) => 1 - r)._segment(1), 1 - x)),
      ),
    )
    .innerJoin();
});

/**
 *
 * Shorthand for `.someCyclesBy(0.5, fn)`
 *
 * @name someCycles
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh(3,8)").someCycles(x=>x.speed("0.5"))
 */
export const someCycles = register('someCycles', function (func, pat) {
  return pat._someCyclesBy(0.5, func);
});

/**
 *
 * Shorthand for `.sometimesBy(0.75, fn)`
 *
 * @name often
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").often(x=>x.speed("0.5"))
 */
export const often = register('often', function (func, pat) {
  return pat.sometimesBy(0.75, func);
});

/**
 *
 * Shorthand for `.sometimesBy(0.25, fn)`
 *
 * @name rarely
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").rarely(x=>x.speed("0.5"))
 */
export const rarely = register('rarely', function (func, pat) {
  return pat.sometimesBy(0.25, func);
});

/**
 *
 * Shorthand for `.sometimesBy(0.1, fn)`
 *
 * @name almostNever
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").almostNever(x=>x.speed("0.5"))
 */
export const almostNever = register('almostNever', function (func, pat) {
  return pat.sometimesBy(0.1, func);
});

/**
 *
 * Shorthand for `.sometimesBy(0.9, fn)`
 *
 * @name almostAlways
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").almostAlways(x=>x.speed("0.5"))
 */
export const almostAlways = register('almostAlways', function (func, pat) {
  return pat.sometimesBy(0.9, func);
});

/**
 *
 * Shorthand for `.sometimesBy(0, fn)` (never calls fn)
 *
 * @name never
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").never(x=>x.speed("0.5"))
 */
export const never = register('never', function (_, pat) {
  return pat;
});

/**
 *
 * Shorthand for `.sometimesBy(1, fn)` (always calls fn)
 *
 * @name always
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").always(x=>x.speed("0.5"))
 */
export const always = register('always', function (func, pat) {
  return func(pat);
});
