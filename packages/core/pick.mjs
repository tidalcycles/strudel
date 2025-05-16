/*
pick.mjs - methods that use one pattern to pick events from other patterns.
Copyright (C) 2024 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/signal.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, reify, silence, register } from './pattern.mjs';

import { _mod, clamp, objectMap } from './util.mjs';

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

/** Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
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
