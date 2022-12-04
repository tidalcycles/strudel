/*
pattern.mjs - Core pattern representation for strudel
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/pattern.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import TimeSpan from './timespan.mjs';
import Fraction from './fraction.mjs';
import Hap from './hap.mjs';
import State from './state.mjs';
import { unionWithObj } from './value.mjs';

import { compose, removeUndefineds, flatten, id, listRange, curry, mod, numeralArgs, parseNumeral } from './util.mjs';
import drawLine from './drawLine.mjs';
import { logger } from './logger.mjs';

let stringParser;

// parser is expected to turn a string into a pattern
// if set, the reify function will parse all strings with it
// intended to use with mini to automatically interpret all strings as mini notation
export const setStringParser = (parser) => (stringParser = parser);

/** @class Class representing a pattern. */
export class Pattern {
  _Pattern = true; // this property is used to detect if a pattern that fails instanceof Pattern is an instance of another Pattern
  /**
   * Create a pattern. As an end user, you will most likely not create a Pattern directly.
   *
   * @param {function} query - The function that maps a {@link State} to an array of {@link Hap}.
   */
  constructor(query) {
    this.query = query;
  }

  //////////////////////////////////////////////////////////////////////
  // Haskell-style functor, applicative and monadic operations

  /**
   * Returns a new pattern, with the function applied to the value of
   * each hap. It has the alias {@link Pattern#fmap}.
   * @param {Function} func
   * @returns Pattern
   */
  withValue(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withValue(func)));
  }

  /**
   * see {@link Pattern#withValue}
   */
  fmap(func) {
    return this.withValue(func);
  }

  appWhole(whole_func, pat_val) {
    // Assumes 'this' is a pattern of functions, and given a function to
    // resolve wholes, applies a given pattern of values to that
    // pattern of functions.
    const pat_func = this;
    const query = function (state) {
      const hap_funcs = pat_func.query(state);
      const hap_vals = pat_val.query(state);
      const apply = function (hap_func, hap_val) {
        const s = hap_func.part.intersection(hap_val.part);
        if (s == undefined) {
          return undefined;
        }
        return new Hap(
          whole_func(hap_func.whole, hap_val.whole),
          s,
          hap_func.value(hap_val.value),
          hap_val.combineContext(hap_func),
        );
      };
      return flatten(
        hap_funcs.map((hap_func) => removeUndefineds(hap_vals.map((hap_val) => apply(hap_func, hap_val)))),
      );
    };
    return new Pattern(query);
  }

  /**
   * When this method is called on a pattern of functions, it matches its haps
   * with those in the given pattern of values.  A new pattern is returned, with
   * each matching value applied to the corresponding function.
   *
   * In this `_appBoth` variant, where timespans of the function and value haps
   * are not the same but do intersect, the resulting hap has a timespan of the
   * intersection. This applies to both the part and the whole timespan.
   * @param {Pattern} pat_val
   * @returns Pattern
   */
  appBoth(pat_val) {
    // Tidal's <*>
    const whole_func = function (span_a, span_b) {
      if (span_a == undefined || span_b == undefined) {
        return undefined;
      }
      return span_a.intersection_e(span_b);
    };
    return this.appWhole(whole_func, pat_val);
  }

  /**
   * As with {@link Pattern#appBoth}, but the `whole` timespan is not the intersection,
   * but the timespan from the function of patterns that this method is called
   * on. In practice, this means that the pattern structure, including onsets,
   * are preserved from the pattern of functions (often referred to as the left
   * hand or inner pattern).
   * @param {Pattern} pat_val
   * @returns Pattern
   */
  appLeft(pat_val) {
    const pat_func = this;

    const query = function (state) {
      const haps = [];
      for (const hap_func of pat_func.query(state)) {
        const hap_vals = pat_val.query(state.setSpan(hap_func.wholeOrPart()));
        for (const hap_val of hap_vals) {
          const new_whole = hap_func.whole;
          const new_part = hap_func.part.intersection(hap_val.part);
          if (new_part) {
            const new_value = hap_func.value(hap_val.value);
            const new_context = hap_val.combineContext(hap_func);
            const hap = new Hap(new_whole, new_part, new_value, new_context);
            haps.push(hap);
          }
        }
      }
      return haps;
    };
    return new Pattern(query);
  }

  /**
   * As with {@link Pattern#appLeft}, but `whole` timespans are instead taken from the
   * pattern of values, i.e. structure is preserved from the right hand/outer
   * pattern.
   * @param {Pattern} pat_val
   * @returns Pattern
   */
  appRight(pat_val) {
    const pat_func = this;

    const query = function (state) {
      const haps = [];
      for (const hap_val of pat_val.query(state)) {
        const hap_funcs = pat_func.query(state.setSpan(hap_val.wholeOrPart()));
        for (const hap_func of hap_funcs) {
          const new_whole = hap_val.whole;
          const new_part = hap_func.part.intersection(hap_val.part);
          if (new_part) {
            const new_value = hap_func.value(hap_val.value);
            const new_context = hap_val.combineContext(hap_func);
            const hap = new Hap(new_whole, new_part, new_value, new_context);
            haps.push(hap);
          }
        }
      }
      return haps;
    };
    return new Pattern(query);
  }

  bindWhole(choose_whole, func) {
    const pat_val = this;
    const query = function (state) {
      const withWhole = function (a, b) {
        return new Hap(
          choose_whole(a.whole, b.whole),
          b.part,
          b.value,
          Object.assign({}, a.context, b.context, {
            locations: (a.context.locations || []).concat(b.context.locations || []),
          }),
        );
      };
      const match = function (a) {
        return func(a.value)
          .query(state.setSpan(a.part))
          .map((b) => withWhole(a, b));
      };
      return flatten(pat_val.query(state).map((a) => match(a)));
    };
    return new Pattern(query);
  }

  bind(func) {
    const whole_func = function (a, b) {
      if (a == undefined || b == undefined) {
        return undefined;
      }
      return a.intersection_e(b);
    };
    return this.bindWhole(whole_func, func);
  }

  join() {
    // Flattens a pattern of patterns into a pattern, where wholes are
    // the intersection of matched inner and outer haps.
    return this.bind(id);
  }

  outerBind(func) {
    return this.bindWhole((a) => a, func);
  }

  outerJoin() {
    // Flattens a pattern of patterns into a pattern, where wholes are
    // taken from inner haps.
    return this.outerBind(id);
  }

  innerBind(func) {
    return this.bindWhole((_, b) => b, func);
  }

  innerJoin() {
    // Flattens a pattern of patterns into a pattern, where wholes are
    // taken from inner haps.
    return this.innerBind(id);
  }

  // Flatterns patterns of patterns, by retriggering/resetting inner patterns at onsets of outer pattern haps
  trigJoin(cycleZero = false) {
    const pat_of_pats = this;
    return new Pattern((state) => {
      return (
        pat_of_pats
          // drop continuous haps from the outer pattern.
          .discreteOnly()
          .query(state)
          .map((outer_hap) => {
            return (
              outer_hap.value
                // trig = align the inner pattern cycle start to outer pattern haps
                // Trigzero = align the inner pattern cycle zero to outer pattern haps
                .late(cycleZero ? outer_hap.whole.begin : outer_hap.whole.begin.cyclePos())
                .query(state)
                .map((inner_hap) =>
                  new Hap(
                    // Supports continuous haps in the inner pattern
                    inner_hap.whole ? inner_hap.whole.intersection(outer_hap.whole) : undefined,
                    inner_hap.part.intersection(outer_hap.part),
                    inner_hap.value,
                  ).setContext(outer_hap.combineContext(inner_hap)),
                )
                // Drop haps that didn't intersect
                .filter((hap) => hap.part)
            );
          })
          .flat()
      );
    });
  }

  trigzeroJoin() {
    return this.trigJoin(true);
  }

  // Like the other joins above, joins a pattern of patterns of values, into a flatter
  // pattern of values. In this case it takes whole cycles of the inner pattern to fit each event
  // in the outer pattern.
  squeezeJoin() {
    // A pattern of patterns, which we call the 'outer' pattern, with patterns
    // as values which we call the 'inner' patterns.
    const pat_of_pats = this;
    function query(state) {
      // Get the events with the inner patterns. Ignore continuous events (without 'wholes')
      const haps = pat_of_pats.discreteOnly().query(state);
      // A function to map over the events from the outer pattern.
      function flatHap(outerHap) {
        // Get the inner pattern, slowed and shifted so that the 'whole'
        // timespan of the outer event corresponds to the first cycle of the
        // inner event
        const inner_pat = outerHap.value._focusSpan(outerHap.wholeOrPart());
        // Get the inner events, from the timespan of the outer event's part
        const innerHaps = inner_pat.query(state.setSpan(outerHap.part));
        // A function to map over the inner events, to combine them with the
        // outer event
        function munge(outer, inner) {
          let whole = undefined;
          if (inner.whole && outer.whole) {
            whole = inner.whole.intersection(outer.whole);
            if (!whole) {
              // The wholes are present, but don't intersect
              return undefined;
            }
          }
          const part = inner.part.intersection(outer.part);
          if (!part) {
            // The parts don't intersect
            return undefined;
          }
          const context = inner.combineContext(outer);
          return new Hap(whole, part, inner.value, context);
        }
        return innerHaps.map((innerHap) => munge(outerHap, innerHap));
      }
      const result = flatten(haps.map(flatHap));
      // remove undefineds
      return result.filter((x) => x);
    }
    return new Pattern(query);
  }

  squeezeBind(func) {
    return this.fmap(func).squeezeJoin();
  }

  //////////////////////////////////////////////////////////////////////
  // Utility methods mainly for internal use

  /**
   * Query haps inside the given time span.
   *
   * @param {Fraction | number} begin from time
   * @param {Fraction | number} end to time
   * @returns Hap[]
   * @example
   * const pattern = sequence('a', ['b', 'c'])
   * const haps = pattern.queryArc(0, 1)
   * console.log(haps)
   * silence
   */
  queryArc(begin, end) {
    return this.query(new State(new TimeSpan(begin, end)));
  }

  /**
   * Returns a new pattern, with queries split at cycle boundaries. This makes
   * some calculations easier to express, as all haps are then constrained to
   * happen within a cycle.
   * @returns Pattern
   */
  splitQueries() {
    const pat = this;
    const q = (state) => {
      return flatten(state.span.spanCycles.map((subspan) => pat.query(state.setSpan(subspan))));
    };
    return new Pattern(q);
  }

  /**
   * Returns a new pattern, where the given function is applied to the query
   * timespan before passing it to the original pattern.
   * @param {Function} func the function to apply
   * @returns Pattern
   */
  withQuerySpan(func) {
    return new Pattern((state) => this.query(state.withSpan(func)));
  }

  withQuerySpanMaybe(func) {
    const pat = this;
    return new Pattern((state) => {
      const newState = state.withSpan(func);
      if (!newState.span) {
        return [];
      }
      return pat.query(newState);
    });
  }

  /**
   * As with {@link Pattern#withQuerySpan}, but the function is applied to both the
   * begin and end time of the query timespan.
   * @param {Function} func the function to apply
   * @returns Pattern
   */
  withQueryTime(func) {
    return new Pattern((state) => this.query(state.withSpan((span) => span.withTime(func))));
  }

  /**
   * Similar to {@link Pattern#withQuerySpan}, but the function is applied to the timespans
   * of all haps returned by pattern queries (both `part` timespans, and where
   * present, `whole` timespans).
   * @param {Function} func
   * @returns Pattern
   */
  withHapSpan(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withSpan(func)));
  }

  /**
   * As with {@link Pattern#withHapSpan}, but the function is applied to both the
   * begin and end time of the hap timespans.
   * @param {Function} func the function to apply
   * @returns Pattern
   */
  withHapTime(func) {
    return this.withHapSpan((span) => span.withTime(func));
  }

  /**
   * Returns a new pattern with the given function applied to the list of haps returned by every query.
   * @param {Function} func
   * @returns Pattern
   */
  withHaps(func) {
    return new Pattern((state) => func(this.query(state)));
  }

  /**
   * As with {@link Pattern#withHaps}, but applies the function to every hap, rather than every list of haps.
   * @param {Function} func
   * @returns Pattern
   */
  withHap(func) {
    return this.withHaps((haps) => haps.map(func));
  }

  /**
   * Returns a new pattern with the context field set to every hap set to the given value.
   * @param {*} context
   * @returns Pattern
   */
  setContext(context) {
    return this.withHap((hap) => hap.setContext(context));
  }

  /**
   * Returns a new pattern with the given function applied to the context field of every hap.
   * @param {Function} func
   * @returns Pattern
   */
  withContext(func) {
    return this.withHap((hap) => hap.setContext(func(hap.context)));
  }

  /**
   * Returns a new pattern with the context field of every hap set to an empty object.
   * @returns Pattern
   */
  stripContext() {
    return this.withHap((hap) => hap.setContext({}));
  }

  /**
   * Returns a new pattern with the given location information added to the
   * context of every hap.
   * @param {Number} start
   * @param {Number} end
   * @returns Pattern
   */
  withLocation(start, end) {
    const location = {
      start: { line: start[0], column: start[1], offset: start[2] },
      end: { line: end[0], column: end[1], offset: end[2] },
    };
    return this.withContext((context) => {
      const locations = (context.locations || []).concat([location]);
      return { ...context, locations };
    });
  }

  withMiniLocation(start, end) {
    const offset = {
      start: { line: start[0], column: start[1], offset: start[2] },
      end: { line: end[0], column: end[1], offset: end[2] },
    };
    return this.withContext((context) => {
      let locations = context.locations || [];
      locations = locations.map(({ start, end }) => {
        const colOffset = start.line === 1 ? offset.start.column : 0;
        return {
          start: {
            ...start,
            line: start.line - 1 + (offset.start.line - 1) + 1,
            column: start.column - 1 + colOffset,
          },
          end: {
            ...end,
            line: end.line - 1 + (offset.start.line - 1) + 1,
            column: end.column - 1 + colOffset,
          },
        };
      });
      return { ...context, locations };
    });
  }

  /**
   * Returns a new Pattern, which only returns haps that meet the given test.
   * @param {Function} hap_test - a function which returns false for haps to be removed from the pattern
   * @returns Pattern
   */
  filterHaps(hap_test) {
    return new Pattern((state) => this.query(state).filter(hap_test));
  }

  /**
   * As with {@link Pattern#filterHaps}, but the function is applied to values
   * inside haps.
   * @param {Function} value_test
   * @returns Pattern
   */
  filterValues(value_test) {
    return new Pattern((state) => this.query(state).filter((hap) => value_test(hap.value)));
  }

  /**
   * Returns a new pattern, with haps containing undefined values removed from
   * query results.
   * @returns Pattern
   */
  removeUndefineds() {
    return this.filterValues((val) => val != undefined);
  }

  /**
   * Returns a new pattern, with all haps without onsets filtered out. A hap
   * with an onset is one with a `whole` timespan that begins at the same time
   * as its `part` timespan.
   * @returns Pattern
   */
  onsetsOnly() {
    // Returns a new pattern that will only return haps where the start
    // of the 'whole' timespan matches the start of the 'part'
    // timespan, i.e. the haps that include their 'onset'.
    return this.filterHaps((hap) => hap.hasOnset());
  }

  /**
   * Returns a new pattern, with 'continuous' haps (those without 'whole'
   * timespans) removed from query results.
   * @returns Pattern
   */
  discreteOnly() {
    // removes continuous haps that don't have a 'whole' timespan
    return this.filterHaps((hap) => hap.whole);
  }

  /**
   * Queries the pattern for the first cycle, returning Haps. Mainly of use when
   * debugging a pattern.
   * @param {Boolean} with_context - set to true, otherwise the context field
   * will be stripped from the resulting haps.
   * @returns [Hap]
   */
  firstCycle(with_context = false) {
    var self = this;
    if (!with_context) {
      self = self.stripContext();
    }
    return self.query(new State(new TimeSpan(Fraction(0), Fraction(1))));
  }

  /**
   * Accessor for a list of values returned by querying the first cycle.
   */
  get firstCycleValues() {
    return this.firstCycle().map((hap) => hap.value);
  }

  /**
   * More human-readable version of the {@link Pattern#firstCycleValues} accessor.
   */
  get showFirstCycle() {
    return this.firstCycle().map(
      (hap) => `${hap.value}: ${hap.whole.begin.toFraction()} - ${hap.whole.end.toFraction()}`,
    );
  }

  /**
   * Returns a new pattern, which returns haps sorted in temporal order. Mainly
   * of use when comparing two patterns for equality, in tests.
   * @returns Pattern
   */
  sortHapsByPart() {
    return this.withHaps((haps) =>
      haps.sort((a, b) =>
        a.part.begin
          .sub(b.part.begin)
          .or(a.part.end.sub(b.part.end))
          .or(a.whole.begin.sub(b.whole.begin).or(a.whole.end.sub(b.whole.end))),
      ),
    );
  }

  patternify(join, func) {
    const pat = this;
    return function (...args) {
      // the problem here: args could be a pattern that has been
      // turned into an object to add location to avoid object
      // checking for every pattern method, we can remove it here...
      // in the future, patternified args should be marked as well +
      // some better object handling
      args = args.map((arg) => (isPattern(arg) ? arg.fmap((value) => value.value || value) : arg));
      const pat_arg = sequence(...args);
      // arg.locations has to go somewhere..
      return join(pat_arg.fmap((arg) => func.call(pat, arg)));
    };
  }

  asNumber() {
    return this.fmap(parseNumeral);
  }

  //////////////////////////////////////////////////////////////////////
  // Operators - see 'make composers' later..

  _opIn(other, func) {
    return this.fmap(func).appLeft(reify(other));
  }
  _opOut(other, func) {
    return this.fmap(func).appRight(reify(other));
  }
  _opMix(other, func) {
    return this.fmap(func).appBoth(reify(other));
  }
  _opSqueeze(other, func) {
    const otherPat = reify(other);
    return this.fmap((a) => otherPat.fmap((b) => func(a)(b))).squeezeJoin();
  }
  _opSqueezeOut(other, func) {
    const thisPat = this;
    const otherPat = reify(other);
    return otherPat.fmap((a) => thisPat.fmap((b) => func(b)(a))).squeezeJoin();
  }
  _opTrig(other, func) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a) => func(a)(b))).trigJoin();
  }
  _opTrigzero(other, func) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a) => func(a)(b))).trigzeroJoin();
  }

  //////////////////////////////////////////////////////////////////////
  // End-user methods.
  // Those beginning with an underscore (_) are 'patternified',
  // i.e. versions are created without the underscore, that are
  // magically transformed to accept patterns for all their arguments.

  //////////////////////////////////////////////////////////////////////
  // Numerical transformations

  /**
   * Assumes a numerical pattern. Returns a new pattern with all values rounded
   * to the nearest integer.
   * @name round
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "0.5 1.5 2.5".round().scale('C major').note()
   */
  round() {
    return this.asNumber().fmap((v) => Math.round(v));
  }

  /**
   * Assumes a numerical pattern. Returns a new pattern with all values set to
   * their mathematical floor. E.g. `3.7` replaced with to `3`, and `-4.2`
   * replaced with `-5`.
   * @returns Pattern
   */
  floor() {
    return this.asNumber().fmap((v) => Math.floor(v));
  }

  /**
   * Assumes a numerical pattern. Returns a new pattern with all values set to
   * their mathematical ceiling. E.g. `3.2` replaced with `4`, and `-4.2`
   * replaced with `-4`.
   * @returns Pattern
   */
  ceil() {
    return this.asNumber().fmap((v) => Math.ceil(v));
  }

  /**
   * Assumes a numerical pattern, containing unipolar values in the range 0 ..
   * 1. Returns a new pattern with values scaled to the bipolar range -1 .. 1
   * @returns Pattern
   */
  toBipolar() {
    return this.fmap((x) => x * 2 - 1);
  }

  /**
   * Assumes a numerical pattern, containing bipolar values in the range -1 ..
   * 1. Returns a new pattern with values scaled to the unipolar range 0 .. 1
   * @returns Pattern
   */
  fromBipolar() {
    return this.fmap((x) => (x + 1) / 2);
  }

  /**
   * Assumes a numerical pattern, containing unipolar values in the range 0 .. 1.
   * Returns a new pattern with values scaled to the given min/max range.
   * Most useful in combination with continuous patterns.
   * @name range
   * @memberof Pattern
   * @returns Pattern
   * @example
   * s("bd sd,hh*4").cutoff(sine.range(500,2000).slow(4))
   */
  _range(min, max) {
    return this.mul(max - min).add(min);
  }

  /**
   * Assumes a numerical pattern, containing unipolar values in the range 0 ..
   * 1. Returns a new pattern with values scaled to the given min/max range,
   * following an exponential curve.
   * @param {Number} min
   * @param {Number} max
   * @returns Pattern
   */
  _rangex(min, max) {
    return this._range(Math.log(min), Math.log(max)).fmap(Math.exp);
  }

  /**
   * Assumes a numerical pattern, containing bipolar values in the range -1 ..
   * 1. Returns a new pattern with values scaled to the given min/max range.
   * @param {Number} min
   * @param {Number} max
   * @returns Pattern
   */
  _range2(min, max) {
    return this.fromBipolar()._range(min, max);
  }

  //////////////////////////////////////////////////////////////////////
  // Structural and temporal transformations

  /**
   * Like layer, but with a single function:
   * @name _apply
   * @memberof Pattern
   * @example
   * "<c3 eb3 g3>".scale('C minor').apply(scaleTranspose("0,2,4")).note()
   */
  _apply(func) {
    return func(this);
  }

  /**
   * Layers the result of the given function(s). Like {@link superimpose}, but without the original pattern:
   * @name layer
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*4"
   *   .layer(x=>x.add("0,2"))
   *   .scale('C minor').note()
   */
  layer(...funcs) {
    return stack(...funcs.map((func) => func(this)));
  }

  _ply(factor) {
    return this.fmap((x) => pure(x)._fast(factor)).squeezeJoin();
  }

  _fastGap(factor) {
    // Maybe it's better without this fallback..
    // if (factor < 1) {
    //     // there is no gap.. so maybe revert to _fast?
    //     return this._fast(factor)
    // }
    // A bit fiddly, to drop zero-width queries at the start of the next cycle
    const qf = function (span) {
      const cycle = span.begin.sam();
      const bpos = span.begin.sub(cycle).mul(factor).min(1);
      const epos = span.end.sub(cycle).mul(factor).min(1);
      if (bpos >= 1) {
        return undefined;
      }
      return new TimeSpan(cycle.add(bpos), cycle.add(epos));
    };
    // Also fiddly, to maintain the right 'whole' relative to the part
    const ef = function (hap) {
      const begin = hap.part.begin;
      const end = hap.part.end;
      const cycle = begin.sam();
      const beginPos = begin.sub(cycle).div(factor).min(1);
      const endPos = end.sub(cycle).div(factor).min(1);
      const newPart = new TimeSpan(cycle.add(beginPos), cycle.add(endPos));
      const newWhole = !hap.whole
        ? undefined
        : new TimeSpan(
            newPart.begin.sub(begin.sub(hap.whole.begin).div(factor)),
            newPart.end.add(hap.whole.end.sub(end).div(factor)),
          );
      return new Hap(newWhole, newPart, hap.value, hap.context);
    };
    return this.withQuerySpanMaybe(qf).withHap(ef).splitQueries();
  }

  // Compress each cycle into the given timespan, leaving a gap
  _compress(b, e) {
    if (b.gt(e) || b.gt(1) || e.gt(1) || b.lt(0) || e.lt(0)) {
      return silence;
    }
    return this._fastGap(Fraction(1).div(e.sub(b)))._late(b);
  }

  _compressSpan(span) {
    return this._compress(span.begin, span.end);
  }

  // Similar to compress, but doesn't leave gaps, and the 'focus' can be
  // bigger than a cycle
  _focus(b, e) {
    return this._fast(Fraction(1).div(e.sub(b))).late(b.cyclePos());
  }

  _focusSpan(span) {
    return this._focus(span.begin, span.end);
  }

  /**
   * Speed up a pattern by the given factor. Used by "*" in mini notation.
   *
   * @name fast
   * @memberof Pattern
   * @param {number | Pattern} factor speed up factor
   * @returns Pattern
   * @example
   * s("<bd sd> hh").fast(2) // s("[<bd sd> hh]*2")
   */
  _fast(factor) {
    factor = Fraction(factor);
    const fastQuery = this.withQueryTime((t) => t.mul(factor));
    return fastQuery.withHapTime((t) => t.div(factor));
  }

  /**
   * Slow down a pattern over the given number of cycles. Like the "/" operator in mini notation.
   *
   * @name slow
   * @memberof Pattern
   * @param {number | Pattern} factor slow down factor
   * @returns Pattern
   * @example
   * s("<bd sd> hh").slow(2) // s("[<bd sd> hh]/2")
   */
  _slow(factor) {
    return this._fast(Fraction(1).div(factor));
  }

  _inside(factor, f) {
    return f(this._slow(factor))._fast(factor);
  }

  _outside(factor, f) {
    return f(this._fast(factor))._slow(factor);
  }

  // cpm = cycles per minute
  _cpm(cpm) {
    return this._fast(cpm / 60);
  }

  /**
   * Nudge a pattern to start earlier in time. Equivalent of Tidal's <~ operator
   *
   * @name early
   * @memberof Pattern
   * @param {number | Pattern} cycles number of cycles to nudge left
   * @returns Pattern
   * @example
   * "bd ~".stack("hh ~".early(.1)).s()
   */
  _early(offset) {
    offset = Fraction(offset);
    return this.withQueryTime((t) => t.add(offset)).withHapTime((t) => t.sub(offset));
  }

  /**
   * Nudge a pattern to start later in time. Equivalent of Tidal's ~> operator
   *
   * @name late
   * @memberof Pattern
   * @param {number | Pattern} cycles number of cycles to nudge right
   * @returns Pattern
   * @example
   * "bd ~".stack("hh ~".late(.1)).s()
   */
  _late(offset) {
    offset = Fraction(offset);
    return this._early(Fraction(0).sub(offset));
  }

  _zoom(s, e) {
    e = Fraction(e);
    s = Fraction(s);
    const d = e.sub(s);
    return this.withQuerySpan((span) => span.withCycle((t) => t.mul(d).add(s)))
      .withHapSpan((span) => span.withCycle((t) => t.sub(s).div(d)))
      .splitQueries();
  }

  _zoomArc(a) {
    return this.zoom(a.begin, a.end);
  }

  _linger(t) {
    if (t == 0) {
      return silence;
    } else if (t < 0) {
      return this._zoom(t.add(1), 1)._slow(t);
    }
    return this._zoom(0, t)._slow(t);
  }

  _segment(rate) {
    return this.struct(pure(true)._fast(rate));
  }

  invert() {
    // Swap true/false in a binary pattern
    return this.fmap((x) => !x);
  }

  inv() {
    // alias for invert()
    return this.invert();
  }

  /**
   * Applies the given function whenever the given pattern is in a true state.
   * @name when
   * @memberof Pattern
   * @param {Pattern} binary_pat
   * @param {function} func
   * @returns Pattern
   * @example
   * "c3 eb3 g3".when("<0 1>/2", x=>x.sub(5)).note()
   */
  when(binary_pat, func) {
    //binary_pat = sequence(binary_pat)
    const true_pat = binary_pat.filterValues(id);
    const false_pat = binary_pat.filterValues((val) => !val);
    const with_pat = true_pat.fmap(() => (y) => y).appRight(func(this));
    const without_pat = false_pat.fmap(() => (y) => y).appRight(this);
    return stack(with_pat, without_pat);
  }

  /**
   * Superimposes the function result on top of the original pattern, delayed by the given time.
   * @name off
   * @memberof Pattern
   * @param {Pattern | number} time offset time
   * @param {function} func function to apply
   * @returns Pattern
   * @example
   * "c3 eb3 g3".off(1/8, x=>x.add(7)).note()
   */
  off(time_pat, func) {
    return stack(this, func(this.late(time_pat)));
  }

  /**
   * Applies the given function every n cycles, starting from the first cycle.
   * @name firstOf
   * @memberof Pattern
   * @param {number} n how many cycles
   * @param {function} func function to apply
   * @returns Pattern
   * @example
   * note("c3 d3 e3 g3").firstOf(4, x=>x.rev())
   */
  // TODO - patternify
  firstOf(n, func) {
    const pat = this;
    const pats = Array(n - 1).fill(pat);
    pats.unshift(func(pat));
    return slowcatPrime(...pats);
  }

  /**
   * Applies the given function every n cycles, starting from the last cycle.
   * @name lastOf
   * @memberof Pattern
   * @param {number} n how many cycles
   * @param {function} func function to apply
   * @returns Pattern
   * @example
   * note("c3 d3 e3 g3").lastOf(4, x=>x.rev())
   */
  lastOf(n, func) {
    const pat = this;
    const pats = Array(n - 1).fill(pat);
    pats.push(func(pat));
    return slowcatPrime(...pats);
  }

  /**
   * An alias for {@link firstOf}
   * @name every
   * @memberof Pattern
   * @param {number} n how many cycles
   * @param {function} func function to apply
   * @returns Pattern
   * @example
   * note("c3 d3 e3 g3").every(4, x=>x.rev())
   */
  every(n, func) {
    return this.firstOf(n, func);
  }

  /**
   * Returns a new pattern where every other cycle is played once, twice as
   * fast, and offset in time by one quarter of a cycle. Creates a kind of
   * breakbeat feel.
   * @returns Pattern
   */
  brak() {
    return this.when(slowcat(false, true), (x) => fastcat(x, silence)._late(0.25));
  }

  /**
   * Reverse all haps in a pattern
   *
   * @name rev
   * @memberof Pattern
   * @returns Pattern
   * @example
   * note("c3 d3 e3 g3").rev()
   */
  rev() {
    const pat = this;
    const query = function (state) {
      const span = state.span;
      const cycle = span.begin.sam();
      const next_cycle = span.begin.nextSam();
      const reflect = function (to_reflect) {
        const reflected = to_reflect.withTime((time) => cycle.add(next_cycle.sub(time)));
        // [reflected.begin, reflected.end] = [reflected.end, reflected.begin] -- didn't work
        const tmp = reflected.begin;
        reflected.begin = reflected.end;
        reflected.end = tmp;
        return reflected;
      };
      const haps = pat.query(state.setSpan(reflect(span)));
      return haps.map((hap) => hap.withSpan(reflect));
    };
    return new Pattern(query).splitQueries();
  }

  palindrome() {
    return this.every(2, rev);
  }

  juxBy(by, func) {
    by /= 2;
    const elem_or = function (dict, key, dflt) {
      if (key in dict) {
        return dict[key];
      }
      return dflt;
    };
    const left = this.withValue((val) => Object.assign({}, val, { pan: elem_or(val, 'pan', 0.5) - by }));
    const right = this.withValue((val) => Object.assign({}, val, { pan: elem_or(val, 'pan', 0.5) + by }));

    return stack(left, func(right));
  }

  _jux(func) {
    return this.juxBy(1, func);
  }

  /**
   * Stacks the given pattern(s) to the current pattern.
   * @name stack
   * @memberof Pattern
   * @example
   * s("hh*2").stack(
   *   n("c2(3,8)")
   * )
   */
  stack(...pats) {
    return stack(this, ...pats);
  }

  sequence(...pats) {
    return sequence(this, ...pats);
  }

  /**
   * Appends the given pattern(s) to the current pattern. Synonyms: .sequence .fastcat
   * @name seq
   * @memberof Pattern
   * @example
   * s("hh*2").seq(
   *   n("c2(3,8)")
   * )
   */
  seq(...pats) {
    return sequence(this, ...pats);
  }

  /**
   * Appends the given pattern(s) to the next cycle. Synonym: .slowcat
   * @name cat
   * @memberof Pattern
   * @example
   * s("hh*2").cat(
   *   n("c2(3,8)")
   * )
   */
  cat(...pats) {
    return cat(this, ...pats);
  }

  fastcat(...pats) {
    return fastcat(this, ...pats);
  }

  slowcat(...pats) {
    return slowcat(this, ...pats);
  }

  /**
   * Superimposes the result of the given function(s) on top of the original pattern:
   * @name superimpose
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*4"
   *   .superimpose(x=>x.add(2))
   *   .scale('C minor').note()
   */
  superimpose(...funcs) {
    return this.stack(...funcs.map((func) => func(this)));
  }

  stutWith(times, time, func) {
    return stack(...listRange(0, times - 1).map((i) => func(this.late(Fraction(time).mul(i)), i)));
  }

  stut(times, feedback, time) {
    return this.stutWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
  }

  /**
   * Superimpose and offset multiple times, applying the given function each time.
   * @name echoWith
   * @memberof Pattern
   * @returns Pattern
   * @param {number} times how many times to repeat
   * @param {number} time cycle offset between iterations
   * @param {function} func function to apply, given the pattern and the iteration index
   * @example
   * "<0 [2 4]>"
   * .echoWith(4, 1/8, (p,n) => p.add(n*2))
   * .scale('C minor').note().legato(.2)
   */
  _echoWith(times, time, func) {
    return stack(...listRange(0, times - 1).map((i) => func(this.late(Fraction(time).mul(i)), i)));
  }

  /**
   * Superimpose and offset multiple times, gradually decreasing the velocity
   * @name echo
   * @memberof Pattern
   * @returns Pattern
   * @param {number} times how many times to repeat
   * @param {number} time cycle offset between iterations
   * @param {number} feedback velocity multiplicator for each iteration
   * @example
   * s("bd sd").echo(3, 1/6, .8)
   */
  _echo(times, time, feedback) {
    return this._echoWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
  }

  /**
   * Divides a pattern into a given number of subdivisions, plays the subdivisions in order, but increments the starting subdivision each cycle. The pattern wraps to the first subdivision after the last subdivision is played.
   * @name iter
   * @memberof Pattern
   * @returns Pattern
   * @example
   * note("0 1 2 3".scale('A minor')).iter(4)
   */
  _iter(times, back = false) {
    times = Fraction(times);
    return slowcat(
      ...listRange(0, times.sub(1)).map((i) =>
        back ? this.late(Fraction(i).div(times)) : this.early(Fraction(i).div(times)),
      ),
    );
  }

  /**
   * Like `iter`, but plays the subdivisions in reverse order. Known as iter' in tidalcycles
   * @name iterBack
   * @memberof Pattern
   * @returns Pattern
   * @example
   * note("0 1 2 3".scale('A minor')).iterBack(4)
   */
  _iterBack(times) {
    return this._iter(times, true);
  }

  /**
   * Divides a pattern into a given number of parts, then cycles through those parts in turn, applying the given function to each part in turn (one part per cycle).
   * @name chunk
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "0 1 2 3".chunk(4, x=>x.add(7)).scale('A minor').note()
   */
  _chunk(n, func, back = false) {
    const binary = Array(n - 1).fill(false);
    binary.unshift(true);
    const binary_pat = sequence(...binary)._iter(n, back);
    return this.when(binary_pat, func);
  }

  /**
   * Like `chunk`, but cycles through the parts in reverse order. Known as chunk' in tidalcycles
   * @name chunkBack
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "0 1 2 3".chunkBack(4, x=>x.add(7)).scale('A minor').note()
   */
  _chunkBack(n, func) {
    return this._chunk(n, func, true);
  }

  _bypass(on) {
    on = Boolean(parseInt(on));
    return on ? silence : this;
  }

  //////////////////////////////////////////////////////////////////////
  // Control-related methods, which manipulate patterns of objects

  /**
   * Cuts each sample into the given number of parts, allowing you to explore a technique known as 'granular synthesis'.
   * It turns a pattern of samples into a pattern of parts of samples.
   * @name chop
   * @memberof Pattern
   * @returns Pattern
   * @example
   * samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
   * s("rhodes")
   *  .chop(4)
   *  .rev() // reverse order of chops
   *  .loopAt(4,1) // fit sample into 4 cycles
   *
   */
  _chop(n) {
    const slices = Array.from({ length: n }, (x, i) => i);
    const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
    const func = function (o) {
      return sequence(slice_objects.map((slice_o) => Object.assign({}, o, slice_o)));
    };
    return this.squeezeBind(func);
  }

  _striate(n) {
    const slices = Array.from({ length: n }, (x, i) => i);
    const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
    const slicePat = slowcat(...slice_objects);
    return this.set(slicePat)._fast(n);
  }

  /**
   * Makes the sample fit the given number of cycles by changing the speed.
   * @name loopAt
   * @memberof Pattern
   * @returns Pattern
   * @example
   * samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
   * s("rhodes").loopAt(4,1)
   */
  _loopAt(factor, cps = 1) {
    return this.speed((1 / factor) * cps)
      .unit('c')
      .slow(factor);
  }

  //////////////////////////////////////////////////////////////////////
  // Context methods - ones that deal with metadata

  _color(color) {
    return this.withContext((context) => ({ ...context, color }));
  }

  /**
   *
   * Sets the velocity from 0 to 1. Is multiplied together with gain.
   * @name velocity
   * @example
   * s("hh*8")
   * .gain(".4!2 1 .4!2 1 .4 1")
   * .velocity(".4 1")
   */
  _velocity(velocity) {
    return this.withContext((context) => ({ ...context, velocity: (context.velocity || 1) * velocity }));
  }

  onTrigger(onTrigger, dominant = true) {
    return this.withHap((hap) =>
      hap.setContext({
        ...hap.context,
        onTrigger: (...args) => {
          if (!dominant && hap.context.onTrigger) {
            hap.context.onTrigger(...args);
          }
          onTrigger(...args);
        },
        // we need this to know later if the default trigger should still fire
        dominantTrigger: dominant,
      }),
    );
  }

  log(func = (_, hap) => `[hap] ${hap.showWhole(true)}`) {
    return this.onTrigger((...args) => logger(func(...args)), false);
  }

  logValues(func = id) {
    return this.log((_, hap) => func(hap.value));
  }

  //////////////////////////////////////////////////////////////////////
  // Visualisation

  drawLine() {
    console.log(drawLine(this));
    return this;
  }

  //////////////////////////////////////////////////////////////////////
  // Misc.

  hush() {
    return silence;
  }

  // sets absolute duration of haps
  // TODO - fix
  _duration(value) {
    return this.withHapSpan((span) => new TimeSpan(span.begin, span.begin.add(value)));
  }

  /**
   *
   * Multiplies the hap duration with the given factor.
   * @name legato
   * @memberof Pattern
   * @example
   * note("c3 eb3 g3 c4").legato("<.25 .5 1 2>")
   */
  // TODO - fix
  _legato(value) {
    return this.withHapSpan((span) => new TimeSpan(span.begin, span.begin.add(span.end.sub(span.begin).mul(value))));
  }
}

//////////////////////////////////////////////////////////////////////
// functions relating to chords/patterns of lists

// returns Array<Hap[]> where each list of haps satisfies eq
function groupHapsBy(eq, haps) {
  let groups = [];
  haps.forEach((hap) => {
    const match = groups.findIndex(([other]) => eq(hap, other));
    if (match === -1) {
      groups.push([hap]);
    } else {
      groups[match].push(hap);
    }
  });
  return groups;
}

// congruent haps = haps with equal spans
const congruent = (a, b) => a.spanEquals(b);
// Pattern<Hap<T>> -> Pattern<Hap<T[]>>
// returned pattern contains arrays of congruent haps
Pattern.prototype.collect = function () {
  return this.withHaps((haps) =>
    groupHapsBy(congruent, haps).map((_haps) => new Hap(_haps[0].whole, _haps[0].part, _haps, {})),
  );
};

// applies func to each array of congruent haps
Pattern.prototype.arpWith = function (func) {
  return this.collect()
    .fmap((v) => reify(func(v)))
    .squeezeJoin()
    .withHap((h) => new Hap(h.whole, h.part, h.value.value, h.combineContext(h.value)));
};

// applies pattern of indices to each array of congruent haps
Pattern.prototype.arp = function (pat) {
  return this.arpWith((haps) => pat.fmap((i) => haps[i % haps.length]));
};

//////////////////////////////////////////////////////////////////////
// compose matrix functions

// TODO - adopt value.mjs fully..
function _composeOp(a, b, func) {
  function _nonFunctionObject(x) {
    return x instanceof Object && !(x instanceof Function);
  }
  if (_nonFunctionObject(a) || _nonFunctionObject(b)) {
    if (!_nonFunctionObject(a)) {
      a = { value: a };
    }
    if (!_nonFunctionObject(b)) {
      b = { value: b };
    }
    return unionWithObj(a, b, func);
  }
  return func(a, b);
}

// Make composers
(function () {
  // pattern composers
  const composers = {
    set: [(a, b) => b],
    keep: [(a) => a],
    keepif: [(a, b) => (b ? a : undefined)],

    // numerical functions
    /**
     *
     * Assumes a pattern of numbers. Adds the given number to each item in the pattern.
     * @name add
     * @memberof Pattern
     * @example
     * // Here, the triad 0, 2, 4 is shifted by different amounts
     * "0 2 4".add("<0 3 4 0>").scale('C major').note()
     * // Without add, the equivalent would be:
     * // "<[0 2 4] [3 5 7] [4 6 8] [0 2 4]>".scale('C major').note()
     * @example
     * // You can also use add with notes:
     * "c3 e3 g3".add("<0 5 7 0>").note()
     * // Behind the scenes, the notes are converted to midi numbers:
     * // "48 52 55".add("<0 5 7 0>").note()
     */
    add: [numeralArgs((a, b) => a + b)], // support string concatenation
    /**
     *
     * Like add, but the given numbers are subtracted.
     * @name sub
     * @memberof Pattern
     * @example
     * "0 2 4".sub("<0 1 2 3>").scale('C4 minor').note()
     * // See add for more information.
     */
    sub: [numeralArgs((a, b) => a - b)],
    /**
     *
     * Multiplies each number by the given factor.
     * @name mul
     * @memberof Pattern
     * @example
     * "1 1.5 [1.66, <2 2.33>]".mul(150).freq()
     */
    mul: [numeralArgs((a, b) => a * b)],
    /**
     *
     * Divides each number by the given factor.
     * @name div
     * @memberof Pattern
     */
    div: [numeralArgs((a, b) => a / b)],
    mod: [numeralArgs(mod)],
    pow: [numeralArgs(Math.pow)],
    _and: [numeralArgs((a, b) => a & b)],
    _or: [numeralArgs((a, b) => a | b)],
    _xor: [numeralArgs((a, b) => a ^ b)],
    _lshift: [numeralArgs((a, b) => a << b)],
    _rshift: [numeralArgs((a, b) => a >> b)],

    // TODO - force numerical comparison if both look like numbers?
    lt: [(a, b) => a < b],
    gt: [(a, b) => a > b],
    lte: [(a, b) => a <= b],
    gte: [(a, b) => a >= b],
    eq: [(a, b) => a == b],
    eqt: [(a, b) => a === b],
    ne: [(a, b) => a != b],
    net: [(a, b) => a !== b],
    and: [(a, b) => a && b],
    or: [(a, b) => a || b],

    //  bitwise ops
    func: [(a, b) => b(a)],
  };

  const hows = ['In', 'Out', 'Mix', 'Squeeze', 'SqueezeOut', 'Trig', 'Trigzero'];

  // generate methods to do what and how
  for (const [what, [op, preprocess]] of Object.entries(composers)) {
    for (const how of hows) {
      Pattern.prototype[what + how] = function (...other) {
        var pat = this;
        other = sequence(other);
        if (preprocess) {
          pat = preprocess(pat);
          other = preprocess(other);
        }
        var result;
        // hack to remove undefs when doing 'keepif'
        if (what === 'keepif') {
          // avoid union, as we want to throw away the value of 'b' completely
          result = pat['_op' + how](other, (a) => (b) => op(a, b));
          result = result.removeUndefineds();
        } else {
          result = pat['_op' + how](other, (a) => (b) => _composeOp(a, b, op));
        }
        return result;
      };
      if (how === 'Squeeze') {
        // support 'squeezeIn' longhand
        Pattern.prototype[what + 'SqueezeIn'] = Pattern.prototype[what + how];
      }
      if (how === 'In') {
        // set 'in' to default, but with magic properties to pick a different 'how'
        Object.defineProperty(Pattern.prototype, what, {
          // a getter that returns a function, so 'pat' can be
          // accessed by closures that are methods of that function..
          get: function () {
            const pat = this;
            // wrap the 'in' function as default behaviour
            const wrapper = (...other) => pat[what + 'In'](...other);
            // add methods to that function to pick alternative behaviours
            for (const wraphow of hows) {
              wrapper[wraphow.toLowerCase()] = (...other) => pat[what + wraphow](...other);
            }

            return wrapper;
          },
        });
      } else {
        // default what to 'set', e.g. squeeze = setSqueeze
        if (what === 'set') {
          Pattern.prototype[how.toLowerCase()] = Pattern.prototype[what + how];
        }
      }
    }
  }

  // binary composers
  /**
   * Applies the given structure to the pattern:
   *
   * @name struct
   * @memberof Pattern
   * @returns Pattern
   * @example
   * note("c3,eb3,g3")
   *   .struct("x ~ x ~ ~ x ~ x ~ ~ ~ x ~ x ~ ~")
   *   .slow(4)
   */
  Pattern.prototype.struct = Pattern.prototype.keepifOut;
  Pattern.prototype.structAll = Pattern.prototype.keepOut;
  Pattern.prototype.mask = Pattern.prototype.keepifIn;
  Pattern.prototype.maskAll = Pattern.prototype.keepIn;
  Pattern.prototype.reset = Pattern.prototype.keepifTrig;
  Pattern.prototype.resetAll = Pattern.prototype.keepTrig;
  Pattern.prototype.restart = Pattern.prototype.keepifTrigzero;
  Pattern.prototype.restartAll = Pattern.prototype.keepTrigzero;
})();

// methods of Pattern that get callable factories
Pattern.prototype.patternified = [
  'apply',
  'chop',
  'color',
  'cpm',
  'duration',
  'early',
  'fast',
  'iter',
  'iterBack',
  'jux',
  'late',
  'legato',
  'linger',
  'ply',
  'segment',
  'striate',
  'slow',
  'velocity',
];

// aliases
export const polyrhythm = stack;
export const pr = stack;

// methods that create patterns, which are added to patternified Pattern methods
Pattern.prototype.factories = {
  pure,
  stack,
  slowcat,
  fastcat,
  cat,
  timeCat,
  sequence,
  seq,
  polymeter,
  pm,
  polyrhythm,
  pr,
};
// the magic happens in Pattern constructor. Keeping this in prototype enables adding methods from the outside (e.g. see tonal.ts)

// Elemental patterns

// Nothing
export const silence = new Pattern(() => []);

/** A discrete value that repeats once per cycle.
 *
 * @returns {Pattern}
 * @example
 * pure('e4') // "e4"
 */
export function pure(value) {
  function query(state) {
    return state.span.spanCycles.map((subspan) => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value));
  }
  return new Pattern(query);
}

export function isPattern(thing) {
  // thing?.constructor?.name !== 'Pattern' // <- this will fail when code is mangled
  const is = thing instanceof Pattern || thing?._Pattern;
  // TODO: find out how to check wrong core dependency. below will never work !thing === 'undefined'
  // wrapping it in (..) will result other checks to log that warning (e.g. isPattern('kalimba'))
  /* if (!thing instanceof Pattern) {
    console.warn(
      `Found Pattern that fails "instanceof Pattern" check.
      This may happen if you are using multiple versions of @strudel.cycles/core. 
      Please check by running "npm ls @strudel.cycles/core".`,
    );
    console.log(thing);
  } */
  return is;
}

export function reify(thing) {
  // Turns something into a pattern, unless it's already a pattern
  if (isPattern(thing)) {
    return thing;
  }
  if (stringParser && typeof thing === 'string') {
    return stringParser(thing);
  }
  return pure(thing);
}

/** The given items are played at the same time at the same length.
 *
 * @return {Pattern}
 * @example
 * stack(g3, b3, [e4, d4]).note() // "g3,b3,[e4,d4]".note()
 */
export function stack(...pats) {
  // Array test here is to avoid infinite recursions..
  pats = pats.map((pat) => (Array.isArray(pat) ? sequence(...pat) : reify(pat)));
  const query = (state) => flatten(pats.map((pat) => pat.query(state)));
  return new Pattern(query);
}

/** Concatenation: combines a list of patterns, switching between them successively, one per cycle:
 *
 * synonyms: {@link cat}
 *
 * @return {Pattern}
 * @example
 * slowcat(e5, b4, [d5, c5])
 *
 */
export function slowcat(...pats) {
  // Array test here is to avoid infinite recursions..
  pats = pats.map((pat) => (Array.isArray(pat) ? sequence(...pat) : reify(pat)));

  const query = function (state) {
    const span = state.span;
    const pat_n = mod(span.begin.sam(), pats.length);
    const pat = pats[pat_n];
    if (!pat) {
      // pat_n can be negative, if the span is in the past..
      return [];
    }
    // A bit of maths to make sure that cycles from constituent patterns aren't skipped.
    // For example if three patterns are slowcat-ed, the fourth cycle of the result should
    // be the second (rather than fourth) cycle from the first pattern.
    const offset = span.begin.floor().sub(span.begin.div(pats.length).floor());
    return pat.withHapTime((t) => t.add(offset)).query(state.setSpan(span.withTime((t) => t.sub(offset))));
  };
  return new Pattern(query).splitQueries();
}

/** Concatenation: combines a list of patterns, switching between them successively, one per cycle. Unlike slowcat, this version will skip cycles.
 * @param {...any} items - The items to concatenate
 * @return {Pattern}
 */
export function slowcatPrime(...pats) {
  pats = pats.map(reify);
  const query = function (state) {
    const pat_n = Math.floor(state.span.begin) % pats.length;
    const pat = pats[pat_n]; // can be undefined for same cases e.g. /#cHVyZSg0MikKICAuZXZlcnkoMyxhZGQoNykpCiAgLmxhdGUoLjUp
    return pat?.query(state) || [];
  };
  return new Pattern(query).splitQueries();
}

/** Concatenation: as with {@link slowcat}, but squashes a cycle from each pattern into one cycle
 *
 * Synonyms: {@link seq}, {@link sequence}
 *
 * @param {...any} items - The items to concatenate
 * @return {Pattern}
 * @example
 * fastcat(e5, b4, [d5, c5])
 * // sequence(e5, b4, [d5, c5])
 * // seq(e5, b4, [d5, c5])
 */
export function fastcat(...pats) {
  return slowcat(...pats)._fast(pats.length);
}

/** The given items are con**cat**enated, where each one takes one cycle. Synonym: slowcat
 *
 * @param {...any} items - The items to concatenate
 * @return {Pattern}
 * @example
 * cat(e5, b4, [d5, c5]).note() // "<e5 b4 [d5 c5]>".note()
 *
 */
export function cat(...pats) {
  return slowcat(...pats);
}

/** Like {@link seq}, but each step has a length, relative to the whole.
 * @return {Pattern}
 * @example
 * timeCat([3,e3],[1, g3]).note() // "e3@3 g3".note()
 */
export function timeCat(...timepats) {
  const total = timepats.map((a) => a[0]).reduce((a, b) => a.add(b), Fraction(0));
  let begin = Fraction(0);
  const pats = [];
  for (const [time, pat] of timepats) {
    const end = begin.add(time);
    pats.push(reify(pat)._compress(begin.div(total), end.div(total)));
    begin = end;
  }
  return stack(...pats);
}

/** See {@link fastcat} */
export function sequence(...pats) {
  return fastcat(...pats);
}

/** Like **cat**, but the items are crammed into one cycle. Synonyms: fastcat, sequence
 * @example
 * seq(e5, b4, [d5, c5]).note() // "e5 b4 [d5 c5]".note()
 *
 */
export function seq(...pats) {
  return fastcat(...pats);
}

function _sequenceCount(x) {
  if (Array.isArray(x)) {
    if (x.length == 0) {
      return [silence, 0];
    }
    if (x.length == 1) {
      return _sequenceCount(x[0]);
    }
    return [fastcat(...x.map((a) => _sequenceCount(a)[0])), x.length];
  }
  return [reify(x), 1];
}

export function polymeterSteps(steps, ...args) {
  const seqs = args.map((a) => _sequenceCount(a));
  if (seqs.length == 0) {
    return silence;
  }
  if (steps == 0) {
    steps = seqs[0][1];
  }
  const pats = [];
  for (const seq of seqs) {
    if (seq[1] == 0) {
      continue;
    }
    if (steps == seq[1]) {
      pats.push(seq[0]);
    } else {
      pats.push(seq[0]._fast(Fraction(steps).div(Fraction(seq[1]))));
    }
  }
  return stack(...pats);
}

export function polymeter(...args) {
  return polymeterSteps(0, ...args);
}

// alias
export function pm(...args) {
  polymeter(...args);
}

export const add = curry((a, pat) => pat.add(a));
export const chop = curry((a, pat) => pat.chop(a));
export const chunk = curry((a, pat) => pat.chunk(a));
export const chunkBack = curry((a, pat) => pat.chunkBack(a));
export const div = curry((a, pat) => pat.div(a));
export const early = curry((a, pat) => pat.early(a));
export const echo = curry((a, b, c, pat) => pat.echo(a, b, c));
export const every = curry((i, f, pat) => pat.every(i, f));
export const fast = curry((a, pat) => pat.fast(a));
export const inv = (pat) => pat.inv();
export const invert = (pat) => pat.invert();
export const iter = curry((a, pat) => pat.iter(a));
export const iterBack = curry((a, pat) => pat.iterBack(a));
export const jux = curry((f, pat) => pat.jux(f));
export const juxBy = curry((by, f, pat) => pat.juxBy(by, f));
export const late = curry((a, pat) => pat.late(a));
export const linger = curry((a, pat) => pat.linger(a));
export const mask = curry((a, pat) => pat.mask(a));
export const mul = curry((a, pat) => pat.mul(a));
export const off = curry((t, f, pat) => pat.off(t, f));
export const ply = curry((a, pat) => pat.ply(a));
export const range = curry((a, b, pat) => pat.range(a, b));
export const rangex = curry((a, b, pat) => pat.rangex(a, b));
export const range2 = curry((a, b, pat) => pat.range2(a, b));
export const rev = (pat) => pat.rev();
export const slow = curry((a, pat) => pat.slow(a));
export const struct = curry((a, pat) => pat.struct(a));
export const sub = curry((a, pat) => pat.sub(a));
export const superimpose = curry((array, pat) => pat.superimpose(...array));
export const set = curry((a, pat) => pat.set(a));
export const when = curry((binary, f, pat) => pat.when(binary, f));

// problem: curried functions with spread arguments must have pat at the beginning
// with this, we cannot keep the pattern open at the end.. solution for now: use array to keep using pat as last arg

// these are the core composable functions. they are extended with Pattern.prototype.define below
Pattern.prototype.composable = { fast, slow, early, late, superimpose };

// adds Pattern.prototype.composable to given function as child functions
// then you can do transpose(2).late(0.2) instead of x => x.transpose(2).late(0.2)
export function makeComposable(func) {
  Object.entries(Pattern.prototype.composable).forEach(([functionName, composable]) => {
    // compose with dot
    func[functionName] = (...args) => {
      // console.log(`called ${functionName}(${args.join(',')})`);
      const composition = compose(func, composable(...args));
      // the composition itself must be composable too :)
      // then you can do endless chaining transpose(2).late(0.2).fast(2) ...
      return makeComposable(composition);
    };
  });
  return func;
}

export const patternify2 = (f) => (pata, patb, pat) =>
  pata
    .fmap((a) => (b) => f.call(pat, a, b))
    .appLeft(patb)
    .innerJoin();
export const patternify3 = (f) => (pata, patb, patc, pat) =>
  pata
    .fmap((a) => (b) => (c) => f.call(pat, a, b, c))
    .appLeft(patb)
    .appLeft(patc)
    .innerJoin();
export const patternify4 = (f) => (pata, patb, patc, patd, pat) =>
  pata
    .fmap((a) => (b) => (c) => (d) => f.call(pat, a, b, c, d))
    .appLeft(patb)
    .appLeft(patc)
    .appLeft(patd)
    .innerJoin();

Pattern.prototype.echo = function (...args) {
  args = args.map(reify);
  return patternify3(Pattern.prototype._echo)(...args, this);
};
Pattern.prototype.echoWith = function (...args) {
  args = args.map(reify);
  return patternify3(Pattern.prototype._echoWith)(...args, this);
};
Pattern.prototype.chunk = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._chunk)(...args, this);
};
Pattern.prototype.chunkBack = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._chunkBack)(...args, this);
};
Pattern.prototype.loopAt = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._loopAt)(...args, this);
};
Pattern.prototype.zoom = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._zoom)(...args, this);
};
Pattern.prototype.compress = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._compress)(...args, this);
};
Pattern.prototype.outside = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._outside)(...args, this);
};
Pattern.prototype.inside = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._inside)(...args, this);
};
Pattern.prototype.range = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._range)(...args, this);
};
Pattern.prototype.rangex = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._rangex)(...args, this);
};
Pattern.prototype.range2 = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._range2)(...args, this);
};

// call this after all Pattern.prototype.define calls have been executed! (right before evaluate)
Pattern.prototype.bootstrap = function () {
  // makeComposable(Pattern.prototype);
  const bootstrapped = Object.fromEntries(
    Object.entries(Pattern.prototype.composable).map(([functionName, composable]) => {
      if (Pattern.prototype[functionName]) {
        // without this, 'C^7'.m.chordBass.transpose(2) will throw "C^7".m.chordBass.transpose is not a function
        // Pattern.prototype[functionName] = makeComposable(Pattern.prototype[functionName]); // is this needed?
      }
      return [functionName, curry(composable, makeComposable)];
    }),
  );
  // note: this === Pattern.prototype
  this.patternified.forEach((prop) => {
    // the following will patternify all functions in Pattern.prototype.patternified
    Pattern.prototype[prop] = function (...args) {
      return this.patternify((x) => x.innerJoin(), Pattern.prototype['_' + prop])(...args);
    };

    /*
    const func = Pattern.prototype['_' + prop];
    Pattern.prototype[prop] = function (...args) {
      return this.patternify(x => x.innerJoin(), func);
    };

     Object.defineProperty(Pattern.prototype, prop, {
      // a getter that returns a function, so 'pat' can be
      // accessed by closures that are methods of that function..
      get: function() {
	const pat = this;
	// wrap the default behaviour
        const wrapper = pat.patternify(x => x.innerJoin(), func);

	// add the variants
        wrapper['in'] = pat.patternify(x => x.innerJoin(), func);
        wrapper['out'] = pat.patternify(x => x.outerJoin(), func);
        wrapper['trig'] = pat.patternify(x => x.trigJoin(), func);
        wrapper['trigzero'] = pat.patternify(x => x.trigzeroJoin(), func);
        wrapper['squeeze'] = pat.patternify(x => x.squeezeJoin(), func);
	    
	return wrapper;
      }
    });
    */

    // with the following, you can do, e.g. `stack(c3).fast.slowcat(1, 2, 4, 8)` instead of `stack(c3).fast(slowcat(1, 2, 4, 8))`
    // TODO: find a way to implement below outside of constructor (code only worked there)
    /* Object.assign(
      Pattern.prototype[prop],
      Object.fromEntries(
        Object.entries(Pattern.prototype.factories).map(([type, func]) => [
          type,
          function(...args) {
            console.log('this', this);
            return this[prop](func(...args)) 
          }
        ])
      )
    ); */
  });
  return bootstrapped;
};

// this will add func as name to list of composable / patternified functions.
// those lists will be used in bootstrap to curry and compose everything, to support various call patterns
Pattern.prototype.define = (name, func, options = {}) => {
  if (options.composable) {
    Pattern.prototype.composable[name] = func;
  }
  if (options.patternified) {
    Pattern.prototype.patternified = Pattern.prototype.patternified.concat([name]);
  }
  Pattern.prototype.bootstrap(); // automatically bootstrap after new definition
};

// Pattern.prototype.define('early', (a, pat) => pat.early(a), { patternified: true, composable: true });
Pattern.prototype.define('hush', (pat) => pat.hush(), { patternified: false, composable: true });
Pattern.prototype.define('bypass', (pat) => pat.bypass(1), { patternified: true, composable: true });
