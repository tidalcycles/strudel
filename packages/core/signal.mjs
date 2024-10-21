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
 * note("<c3 [eb3,g3] g2 [g3,bb3]>*8")
 * .clip(saw.slow(2))
 * @example
 * n(saw.range(0,8).segment(8))
 * .scale('C major')
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
 * n(sine.segment(16).range(0,15))
 * .scale("C:minor")
 *
 */
export const sine = sine2.fromBipolar();

/**
 *  A cosine signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * n(stack(sine,cosine).segment(16).range(0,15))
 * .scale("C:minor")
 *
 */
export const cosine = sine._early(Fraction(1).div(4));
export const cosine2 = sine2._early(Fraction(1).div(4));

/**
 *  A square signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * n(square.segment(4).range(0,7)).scale("C:minor")
 *
 */
export const square = signal((t) => Math.floor((t * 2) % 2));
export const square2 = square.toBipolar();

/**
 *  A triangle signal between 0 and 1.
 *
 * @return {Pattern}
 * @example
 * n(tri.segment(8).range(0,7)).scale("C:minor")
 *
 */
export const tri = fastcat(isaw, saw);
export const tri2 = fastcat(isaw2, saw2);

export const time = signal(id);

/**
 *  The mouse's x position value ranges from 0 to 1.
 * @name mousex
 * @return {Pattern}
 * @example
 * n(mousex.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The mouse's y position value ranges from 0 to 1.
 * @name mousey
 * @return {Pattern}
 * @example
 * n(mousey.segment(4).range(0,7)).scale("C:minor")
 *
 */
let _mouseY = 0,
  _mouseX = 0;
if (typeof window !== 'undefined') {
  //document.onmousemove = (e) => {
  document.addEventListener('mousemove', (e) => {
    _mouseY = e.clientY / document.body.clientHeight;
    _mouseX = e.clientX / document.body.clientWidth;
  });
}

export const mousey = signal(() => _mouseY);
export const mouseY = signal(() => _mouseY);
export const mousex = signal(() => _mouseX);
export const mouseX = signal(() => _mouseX);

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
  for (let i = 0; i < n; ++i) {
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
 * n(run(4)).scale("C4:pentatonic")
 * // n("0 1 2 3").scale("C4:pentatonic")
 */
export const run = (n) => saw.range(0, n).floor().segment(n);

export const randrun = (n) => {
  return signal((t) => {
    // Without adding 0.5, the first cycle is always 0,1,2,3,...
    const rands = timeToRands(t.floor().add(0.5), n);
    const nums = rands
      .map((n, i) => [n, i])
      .sort((a, b) => a[0] > b[0] - a[0] < b[0])
      .map((x) => x[1]);
    const i = t.cyclePos().mul(n).floor() % n;
    return nums[i];
  })._segment(n);
};

const _rearrangeWith = (ipat, n, pat) => {
  const pats = [...Array(n).keys()].map((i) => pat.zoom(Fraction(i).div(n), Fraction(i + 1).div(n)));
  return ipat.fmap((i) => pats[i].repeatCycles(n)._fast(n)).innerJoin();
};

/**
 * @name shuffle
 * Slices a pattern into the given number of parts, then plays those parts in random order.
 * Each part will be played exactly once per cycle.
 * @example
 * note("c d e f").sound("piano").shuffle(4)
 * @example
 * note("c d e f".shuffle(4), "g").sound("piano")
 */
export const shuffle = register('shuffle', (n, pat) => {
  return _rearrangeWith(randrun(n), n, pat);
});

/**
 * @name scramble
 * Slices a pattern into the given number of parts, then plays those parts at random. Similar to `shuffle`,
 * but parts might be played more than once, or not at all, per cycle.
 * @example
 * note("c d e f").sound("piano").scramble(4)
 * @example
 * note("c d e f".scramble(4), "g").sound("piano")
 */
export const scramble = register('scramble', (n, pat) => {
  return _rearrangeWith(_irand(n)._segment(n), n, pat);
});

/**
 * A continuous pattern of random numbers, between 0 and 1.
 *
 * @name rand
 * @example
 * // randomly change the cutoff
 * s("bd*4,hh*8").cutoff(rand.range(500,8000))
 *
 */
export const rand = signal(timeToRand);
/**
 * A continuous pattern of random numbers, between -1 and 1
 */
export const rand2 = rand.toBipolar();

export const _brandBy = (p) => rand.fmap((x) => x < p);

/**
 * A continuous pattern of 0 or 1 (binary random), with a probability for the value being 1
 *
 * @name brandBy
 * @param {number} probability - a number between 0 and 1
 * @example
 * s("hh*10").pan(brandBy(0.2))
 */
export const brandBy = (pPat) => reify(pPat).fmap(_brandBy).innerJoin();

/**
 * A continuous pattern of 0 or 1 (binary random)
 *
 * @name brand
 * @example
 * s("hh*10").pan(brand)
 */
export const brand = _brandBy(0.5);

export const _irand = (i) => rand.fmap((x) => Math.trunc(x * i));

/**
 * A continuous pattern of random integers, between 0 and n-1.
 *
 * @name irand
 * @param {number} n max value (exclusive)
 * @example
 * // randomly select scale notes from 0 - 7 (= C to C)
 * n(irand(8)).struct("x x*2 x x*3").scale("C:minor")
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

export const pick = function (lookup, pat) {
  // backward compatibility - the args used to be flipped
  if (Array.isArray(pat)) {
    [pat, lookup] = [lookup, pat];
  }
  return __pick(lookup, pat);
};

const __pick = register('pick', function (lookup, pat) {
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

/** * pickF lets you use a pattern of numbers to pick which function to apply to another pattern.
 * @param {Pattern} pat
 * @param {Pattern} lookup a pattern of indices
 * @param {function[]} funcs the array of functions from which to pull
 * @returns {Pattern}
 * @example
 * s("bd [rim hh]").pickF("<0 1 2>", [rev,jux(rev),fast(2)])
 * @example
 * note("<c2 d2>(3,8)").s("square")
 *     .pickF("<0 2> 1", [jux(rev),fast(2),x=>x.lpf(800)])
 */
export const pickF = register('pickF', function (lookup, funcs, pat) {
  return pat.apply(pick(lookup, funcs));
});

/** * The same as `pickF`, but if you pick a number greater than the size of the functions list,
 * it wraps around, rather than sticking at the maximum value.
 * @param {Pattern} pat
 * @param {Pattern} lookup a pattern of indices
 * @param {function[]} funcs the array of functions from which to pull
 * @returns {Pattern}
 */
export const pickmodF = register('pickmodF', function (lookup, funcs, pat) {
  return pat.apply(pickmod(lookup, funcs));
});

/** * Similar to `pick`, but it applies an outerJoin instead of an innerJoin.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */
export const pickOut = register('pickOut', function (lookup, pat) {
  return _pick(lookup, pat, false).outerJoin();
});

/** * The same as `pickOut`, but if you pick a number greater than the size of the list,
 * it wraps around, rather than sticking at the maximum value.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */
export const pickmodOut = register('pickmodOut', function (lookup, pat) {
  return _pick(lookup, pat, true).outerJoin();
});

/** * Similar to `pick`, but the choosen pattern is restarted when its index is triggered.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */
export const pickRestart = register('pickRestart', function (lookup, pat) {
  return _pick(lookup, pat, false).restartJoin();
});

/** * The same as `pickRestart`, but if you pick a number greater than the size of the list,
 * it wraps around, rather than sticking at the maximum value.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 * @example
 * "<a@2 b@2 c@2 d@2>".pickRestart({
      a: n("0 1 2 0"),
      b: n("2 3 4 ~"),
      c: n("[4 5] [4 3] 2 0"),
      d: n("0 -3 0 ~")
    }).scale("C:major").s("piano")
 */
export const pickmodRestart = register('pickmodRestart', function (lookup, pat) {
  return _pick(lookup, pat, true).restartJoin();
});

/** * Similar to `pick`, but the choosen pattern is reset when its index is triggered.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */
export const pickReset = register('pickReset', function (lookup, pat) {
  return _pick(lookup, pat, false).resetJoin();
});

/** * The same as `pickReset`, but if you pick a number greater than the size of the list,
 * it wraps around, rather than sticking at the maximum value.
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */
export const pickmodReset = register('pickmodReset', function (lookup, pat) {
  return _pick(lookup, pat, true).resetJoin();
});

/**
/** * Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
 * Similar to `pick`, but cycles are squeezed into the target ('inhabited') pattern.
 * @name inhabit
 * @synonyms pickSqueeze
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
export const { inhabit, pickSqueeze } = register(['inhabit', 'pickSqueeze'], function (lookup, pat) {
  return _pick(lookup, pat, false).squeezeJoin();
});

/** * The same as `inhabit`, but if you pick a number greater than the size of the list,
 * it wraps around, rather than sticking at the maximum value.
 * For example, if you pick the fifth pattern of a list of three, you'll get the
 * second one.
 * @name inhabitmod
 * @synonyms pickmodSqueeze
 * @param {Pattern} pat
 * @param {*} xs
 * @returns {Pattern}
 */

export const { inhabitmod, pickmodSqueeze } = register(['inhabitmod', 'pickmodSqueeze'], function (lookup, pat) {
  return _pick(lookup, pat, true).squeezeJoin();
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
 * @example
 * note("c2 g2!2 d2 f1").s(choose("sine", "triangle", "bd:6"))
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
 * @synonyms randcat
 * @returns {Pattern}
 * @example
 * chooseCycles("bd", "hh", "sd").s().fast(8)
 * @example
 * s("bd | hh | sd").fast(8)
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

/**
 * Chooses randomly from the given list of elements by giving a probability to each element
 * @param {...any} pairs arrays of value and weight
 * @returns {Pattern} - a continuous pattern.
 * @example
 * note("c2 g2!2 d2 f1").s(wchoose(["sine",10], ["triangle",1], ["bd:6",1]))
 */
export const wchoose = (...pairs) => wchooseWith(rand, ...pairs);

/**
 * Picks one of the elements at random each cycle by giving a probability to each element
 * @synonyms wrandcat
 * @returns {Pattern}
 * @example
 * wchooseCycles(["bd",10], ["hh",1], ["sd",1]).s().fast(8)
 * @example
 * wchooseCycles(["bd bd bd",5], ["hh hh hh",3], ["sd sd sd",1]).fast(4).s()
 */
export const wchooseCycles = (...pairs) => _wchooseWith(rand.segment(1), ...pairs).innerJoin();

export const wrandcat = wchooseCycles;

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
 * s("bd*4,hh*8").cutoff(perlin.range(500,8000))
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
 * @example
 * s("hh*10").layer(
 *   x => x.degradeBy(0.2).pan(0),
 *   x => x.undegradeBy(0.8).pan(1)
 * )
 */
export const undegradeBy = register('undegradeBy', function (x, pat) {
  return pat._degradeByWith(
    rand.fmap((r) => 1 - r),
    x,
  );
});

/**
 * Inverse of `degrade`: Randomly removes 50% of events from the pattern. Shorthand for `.undegradeBy(0.5)`
 * Events that would be removed by degrade are let through by undegrade and vice versa (see second example).
 *
 * @name undegrade
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("hh*8").undegrade()
 * @example
 * s("hh*10").layer(
 *   x => x.degrade().pan(0),
 *   x => x.undegrade().pan(1)
 * )
 */
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
 * s("hh*8").sometimesBy(.4, x=>x.speed("0.5"))
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
 * s("hh*8").sometimes(x=>x.speed("0.5"))
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
 * s("bd,hh*8").someCyclesBy(.3, x=>x.speed("0.5"))
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
 * s("bd,hh*8").someCycles(x=>x.speed("0.5"))
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
