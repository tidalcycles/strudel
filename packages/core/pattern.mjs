/*
pattern.mjs - Core pattern representation for strudel
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/pattern.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import TimeSpan from './timespan.mjs';
import Fraction, { lcm } from './fraction.mjs';
import Hap from './hap.mjs';
import State from './state.mjs';
import { unionWithObj } from './value.mjs';

import {
  uniqsortr,
  removeUndefineds,
  flatten,
  id,
  listRange,
  curry,
  _mod,
  numeralArgs,
  parseNumeral,
  pairs,
} from './util.mjs';
import drawLine from './drawLine.mjs';
import { logger } from './logger.mjs';

let stringParser;

let __tactus = true;

export const calculateTactus = function (x) {
  __tactus = x ? true : false;
};

// parser is expected to turn a string into a pattern
// if set, the reify function will parse all strings with it
// intended to use with mini to automatically interpret all strings as mini notation
export const setStringParser = (parser) => (stringParser = parser);

/** @class Class representing a pattern. */
export class Pattern {
  /**
   * Create a pattern. As an end user, you will most likely not create a Pattern directly.
   *
   * @param {function} query - The function that maps a `State` to an array of `Hap`.
   * @noAutocomplete
   */
  constructor(query, tactus = undefined) {
    this.query = query;
    this._Pattern = true; // this property is used to detectinstance of another Pattern
    this.tactus = tactus; // in terms of number of steps per cycle
  }

  get tactus() {
    return this.__tactus;
  }

  set tactus(tactus) {
    this.__tactus = tactus === undefined ? undefined : Fraction(tactus);
  }

  setTactus(tactus) {
    this.tactus = tactus;
    return this;
  }

  withTactus(f) {
    if (!__tactus) {
      return this;
    }
    return new Pattern(this.query, this.tactus === undefined ? undefined : f(this.tactus));
  }

  get hasTactus() {
    return this.tactus !== undefined;
  }

  //////////////////////////////////////////////////////////////////////
  // Haskell-style functor, applicative and monadic operations

  /**
   * Returns a new pattern, with the function applied to the value of
   * each hap. It has the alias `fmap`.
   * @synonyms fmap
   * @param {Function} func to to apply to the value
   * @returns Pattern
   * @example
   * "0 1 2".withValue(v => v + 10).log()
   */
  withValue(func) {
    const result = new Pattern((state) => this.query(state).map((hap) => hap.withValue(func)));
    result.tactus = this.tactus;
    return result;
  }

  // runs func on query state
  withState(func) {
    return this.withHaps((haps, state) => {
      func(state);
      return haps;
    });
  }

  /**
   * see `withValue`
   * @noAutocomplete
   */
  fmap(func) {
    return this.withValue(func);
  }

  /**
   * Assumes 'this' is a pattern of functions, and given a function to
   * resolve wholes, applies a given pattern of values to that
   * pattern of functions.
   * @param {Function} whole_func
   * @param {Function} func
   * @noAutocomplete
   * @returns Pattern
   */
  appWhole(whole_func, pat_val) {
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
   * @noAutocomplete
   * @returns Pattern
   */
  appBoth(pat_val) {
    const pat_func = this;

    // Tidal's <*>
    const whole_func = function (span_a, span_b) {
      if (span_a == undefined || span_b == undefined) {
        return undefined;
      }
      return span_a.intersection_e(span_b);
    };
    const result = pat_func.appWhole(whole_func, pat_val);
    if (__tactus) {
      result.tactus = lcm(pat_val.tactus, pat_func.tactus);
    }
    return result;
  }

  /**
   * As with `appBoth`, but the `whole` timespan is not the intersection,
   * but the timespan from the function of patterns that this method is called
   * on. In practice, this means that the pattern structure, including onsets,
   * are preserved from the pattern of functions (often referred to as the left
   * hand or inner pattern).
   * @param {Pattern} pat_val
   * @noAutocomplete
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
    const result = new Pattern(query);
    result.tactus = this.tactus;
    return result;
  }

  /**
   * As with `appLeft`, but `whole` timespans are instead taken from the
   * pattern of values, i.e. structure is preserved from the right hand/outer
   * pattern.
   * @param {Pattern} pat_val
   * @noAutocomplete
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
    const result = new Pattern(query);
    result.tactus = pat_val.tactus;
    return result;
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
    return this.bindWhole((a) => a, func).setTactus(this.tactus);
  }

  outerJoin() {
    // Flattens a pattern of patterns into a pattern, where wholes are
    // taken from outer haps.
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
  resetJoin(restart = false) {
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
                // reset = align the inner pattern cycle start to outer pattern haps
                // restart = align the inner pattern cycle zero to outer pattern haps
                .late(restart ? outer_hap.whole.begin : outer_hap.whole.begin.cyclePos())
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

  restartJoin() {
    return this.resetJoin(true);
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

  polyJoin = function () {
    const pp = this;
    return pp.fmap((p) => p.s_extend(pp.tactus.div(p.tactus))).outerJoin();
  };

  polyBind(func) {
    return this.fmap(func).polyJoin();
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
   * @noAutocomplete
   */
  queryArc(begin, end, controls = {}) {
    try {
      return this.query(new State(new TimeSpan(begin, end), controls));
    } catch (err) {
      logger(`[query]: ${err.message}`, 'error');
      return [];
    }
  }

  /**
   * Returns a new pattern, with queries split at cycle boundaries. This makes
   * some calculations easier to express, as all haps are then constrained to
   * happen within a cycle.
   * @returns Pattern
   * @noAutocomplete
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
   * @noAutocomplete
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
   * As with `withQuerySpan`, but the function is applied to both the
   * begin and end time of the query timespan.
   * @param {Function} func the function to apply
   * @returns Pattern
   * @noAutocomplete
   */
  withQueryTime(func) {
    return new Pattern((state) => this.query(state.withSpan((span) => span.withTime(func))));
  }

  /**
   * Similar to `withQuerySpan`, but the function is applied to the timespans
   * of all haps returned by pattern queries (both `part` timespans, and where
   * present, `whole` timespans).
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withHapSpan(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withSpan(func)));
  }

  /**
   * As with `withHapSpan`, but the function is applied to both the
   * begin and end time of the hap timespans.
   * @param {Function} func the function to apply
   * @returns Pattern
   * @noAutocomplete
   */
  withHapTime(func) {
    return this.withHapSpan((span) => span.withTime(func));
  }

  /**
   * Returns a new pattern with the given function applied to the list of haps returned by every query.
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withHaps(func) {
    const result = new Pattern((state) => func(this.query(state), state));
    result.tactus = this.tactus;
    return result;
  }

  /**
   * As with `withHaps`, but applies the function to every hap, rather than every list of haps.
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withHap(func) {
    return this.withHaps((haps) => haps.map(func));
  }

  /**
   * Returns a new pattern with the context field set to every hap set to the given value.
   * @param {*} context
   * @returns Pattern
   * @noAutocomplete
   */
  setContext(context) {
    return this.withHap((hap) => hap.setContext(context));
  }

  /**
   * Returns a new pattern with the given function applied to the context field of every hap.
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withContext(func) {
    const result = this.withHap((hap) => hap.setContext(func(hap.context)));
    if (this.__pure !== undefined) {
      result.__pure = this.__pure;
      result.__pure_loc = this.__pure_loc;
    }
    return result;
  }

  /**
   * Returns a new pattern with the context field of every hap set to an empty object.
   * @returns Pattern
   * @noAutocomplete
   */
  stripContext() {
    return this.withHap((hap) => hap.setContext({}));
  }

  /**
   * Returns a new pattern with the given location information added to the
   * context of every hap.
   * @param {Number} start start offset
   * @param {Number} end end offset
   * @returns Pattern
   * @noAutocomplete
   */
  withLoc(start, end) {
    const location = {
      start,
      end,
    };
    const result = this.withContext((context) => {
      const locations = (context.locations || []).concat([location]);
      return { ...context, locations };
    });
    if (this.__pure) {
      result.__pure = this.__pure;
      result.__pure_loc = location;
    }
    return result;
  }

  /**
   * Returns a new Pattern, which only returns haps that meet the given test.
   * @param {Function} hap_test - a function which returns false for haps to be removed from the pattern
   * @returns Pattern
   * @noAutocomplete
   */
  filterHaps(hap_test) {
    return new Pattern((state) => this.query(state).filter(hap_test));
  }

  /**
   * As with `filterHaps`, but the function is applied to values
   * inside haps.
   * @param {Function} value_test
   * @returns Pattern
   * @noAutocomplete
   */
  filterValues(value_test) {
    return new Pattern((state) => this.query(state).filter((hap) => value_test(hap.value))).setTactus(this.tactus);
  }

  /**
   * Returns a new pattern, with haps containing undefined values removed from
   * query results.
   * @returns Pattern
   * @noAutocomplete
   */
  removeUndefineds() {
    return this.filterValues((val) => val != undefined);
  }

  /**
   * Returns a new pattern, with all haps without onsets filtered out. A hap
   * with an onset is one with a `whole` timespan that begins at the same time
   * as its `part` timespan.
   * @returns Pattern
   * @noAutocomplete
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
   * @noAutocomplete
   */
  discreteOnly() {
    // removes continuous haps that don't have a 'whole' timespan
    return this.filterHaps((hap) => hap.whole);
  }

  /**
   * Combines adjacent haps with the same value and whole.  Only
   * intended for use in tests.
   * @noAutocomplete
   */
  defragmentHaps() {
    // remove continuous haps
    const pat = this.discreteOnly();

    return pat.withHaps((haps) => {
      const result = [];
      for (var i = 0; i < haps.length; ++i) {
        var searching = true;
        var a = haps[i];
        while (searching) {
          const a_value = JSON.stringify(haps[i].value);
          var found = false;

          for (var j = i + 1; j < haps.length; j++) {
            const b = haps[j];

            if (a.whole.equals(b.whole)) {
              if (a.part.begin.eq(b.part.end)) {
                if (a_value === JSON.stringify(b.value)) {
                  // eat the matching hap into 'a'
                  a = new Hap(a.whole, new TimeSpan(b.part.begin, a.part.end), a.value);
                  haps.splice(j, 1);
                  // restart the search
                  found = true;
                  break;
                }
              } else if (b.part.begin.eq(a.part.end)) {
                if (a_value == JSON.stringify(b.value)) {
                  // eat the matching hap into 'a'
                  a = new Hap(a.whole, new TimeSpan(a.part.begin, b.part.end), a.value);
                  haps.splice(j, 1);
                  // restart the search
                  found = true;
                  break;
                }
              }
            }
          }

          searching = found;
        }
        result.push(a);
      }
      return result;
    });
  }

  /**
   * Queries the pattern for the first cycle, returning Haps. Mainly of use when
   * debugging a pattern.
   * @param {Boolean} with_context - set to true, otherwise the context field
   * will be stripped from the resulting haps.
   * @returns [Hap]
   * @noAutocomplete
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
   * @noAutocomplete
   */
  get firstCycleValues() {
    return this.firstCycle().map((hap) => hap.value);
  }

  /**
   * More human-readable version of the `firstCycleValues` accessor.
   * @noAutocomplete
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
   * @noAutocomplete
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
  _opReset(other, func) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a) => func(a)(b))).resetJoin();
  }
  _opRestart(other, func) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a) => func(a)(b))).restartJoin();
  }
  _opPoly(other, func) {
    const otherPat = reify(other);
    return this.fmap((b) => otherPat.fmap((a) => func(a)(b))).polyJoin();
  }

  //////////////////////////////////////////////////////////////////////
  // End-user methods.
  // Those beginning with an underscore (_) are 'patternified',
  // i.e. versions are created without the underscore, that are
  // magically transformed to accept patterns for all their arguments.

  //////////////////////////////////////////////////////////////////////
  // Methods without corresponding toplevel functions

  /**
   * Layers the result of the given function(s). Like `superimpose`, but without the original pattern:
   * @name layer
   * @memberof Pattern
   * @synonyms apply
   * @returns Pattern
   * @example
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*8"
   *   .layer(x=>x.add("0,2"))
   *   .scale('C minor').note()
   */
  layer(...funcs) {
    return stack(...funcs.map((func) => func(this)));
  }

  /**
   * Superimposes the result of the given function(s) on top of the original pattern:
   * @name superimpose
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*8"
   *   .superimpose(x=>x.add(2))
   *   .scale('C minor').note()
   */
  superimpose(...funcs) {
    return this.stack(...funcs.map((func) => func(this)));
  }

  //////////////////////////////////////////////////////////////////////
  // Multi-pattern functions

  stack(...pats) {
    return stack(this, ...pats);
  }

  sequence(...pats) {
    return sequence(this, ...pats);
  }

  seq(...pats) {
    return sequence(this, ...pats);
  }
  cat(...pats) {
    return cat(this, ...pats);
  }

  fastcat(...pats) {
    return fastcat(this, ...pats);
  }

  slowcat(...pats) {
    return slowcat(this, ...pats);
  }

  //////////////////////////////////////////////////////////////////////
  // Context methods - ones that deal with metadata

  onTrigger(onTrigger, dominant = true) {
    return this.withHap((hap) =>
      hap.setContext({
        ...hap.context,
        onTrigger: (...args) => {
          // run previously set trigger, if it exists
          hap.context.onTrigger?.(...args);
          onTrigger(...args);
        },
        // if dominantTrigger is set to true, the default output (webaudio) will be disabled
        // when using multiple triggers, you cannot flip this flag to false again!
        // example: x.csound('CooLSynth').log() as well as x.log().csound('CooLSynth') should work the same
        dominantTrigger: hap.context.dominantTrigger || dominant,
      }),
    );
  }

  log(func = (_, hap) => `[hap] ${hap.showWhole(true)}`, getData = (_, hap) => ({ hap })) {
    return this.onTrigger((...args) => {
      logger(func(...args), undefined, getData(...args));
    }, false);
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
}

//////////////////////////////////////////////////////////////////////
// functions relating to chords/patterns of lists/lists of patterns

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

/**
 * Selects indices in in stacked notes.
 * @example
 * note("<[c,eb,g]!2 [c,f,ab] [d,f,ab]>")
 * .arpWith(haps => haps[2])
 * */
Pattern.prototype.arpWith = function (func) {
  return this.collect()
    .fmap((v) => reify(func(v)))
    .innerJoin()
    .withHap((h) => new Hap(h.whole, h.part, h.value.value, h.combineContext(h.value)));
};

/**
 * Selects indices in in stacked notes.
 * @example
 * note("<[c,eb,g]!2 [c,f,ab] [d,f,ab]>")
 * .arp("0 [0,2] 1 [0,2]")
 * */
Pattern.prototype.arp = function (pat) {
  return this.arpWith((haps) => pat.fmap((i) => haps[i % haps.length]));
};

/*
 * Takes a time duration followed by one or more patterns, and shifts the given patterns in time, so they are
 * distributed equally over the given time duration. They are then combined with the pattern 'weave' is called on, after it has been stretched out (i.e. slowed down by) the time duration.
 * @name weave
 * @memberof Pattern
 * @example pan(saw).weave(4, s("bd(3,8)"), s("~ sd"))
 * @example n("0 1 2 3 4 5 6 7").weave(8, s("bd(3,8)"), s("~ sd"))

addToPrototype('weave', function (t, ...pats) {
  return this.weaveWith(t, ...pats.map((x) => set.out(x)));
});

*/
/*
 * Like 'weave', but accepts functions rather than patterns, which are applied to the pattern.
 * @name weaveWith
 * @memberof Pattern

addToPrototype('weaveWith', function (t, ...funcs) {
  const pat = this;
  const l = funcs.length;
  t = Fraction(t);
  if (l == 0) {
    return silence;
  }
  return stack(...funcs.map((func, i) => pat.inside(t, func).early(Fraction(i).div(l))))._slow(t);
});
*/

//////////////////////////////////////////////////////////////////////
// compose matrix functions

function _nonArrayObject(x) {
  return !Array.isArray(x) && typeof x === 'object';
}
function _composeOp(a, b, func) {
  if (_nonArrayObject(a) || _nonArrayObject(b)) {
    if (!_nonArrayObject(a)) {
      a = { value: a };
    }
    if (!_nonArrayObject(b)) {
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
     * n("0 2 4".add("<0 3 4 0>")).scale("C:major")
     * // Without add, the equivalent would be:
     * // n("<[0 2 4] [3 5 7] [4 6 8] [0 2 4]>").scale("C:major")
     * @example
     * // You can also use add with notes:
     * note("c3 e3 g3".add("<0 5 7 0>"))
     * // Behind the scenes, the notes are converted to midi numbers:
     * // note("48 52 55".add("<0 5 7 0>"))
     */
    add: [numeralArgs((a, b) => a + b)], // support string concatenation
    /**
     *
     * Like add, but the given numbers are subtracted.
     * @name sub
     * @memberof Pattern
     * @example
     * n("0 2 4".sub("<0 1 2 3>")).scale("C4:minor")
     * // See add for more information.
     */
    sub: [numeralArgs((a, b) => a - b)],
    /**
     *
     * Multiplies each number by the given factor.
     * @name mul
     * @memberof Pattern
     * @example
     * "<1 1.5 [1.66, <2 2.33>]>*4".mul(150).freq()
     */
    mul: [numeralArgs((a, b) => a * b)],
    /**
     *
     * Divides each number by the given factor.
     * @name div
     * @memberof Pattern
     */
    div: [numeralArgs((a, b) => a / b)],
    mod: [numeralArgs(_mod)],
    pow: [numeralArgs(Math.pow)],
    band: [numeralArgs((a, b) => a & b)],
    bor: [numeralArgs((a, b) => a | b)],
    bxor: [numeralArgs((a, b) => a ^ b)],
    blshift: [numeralArgs((a, b) => a << b)],
    brshift: [numeralArgs((a, b) => a >> b)],

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

  const hows = ['In', 'Out', 'Mix', 'Squeeze', 'SqueezeOut', 'Reset', 'Restart', 'Poly'];

  // generate methods to do what and how
  for (const [what, [op, preprocess]] of Object.entries(composers)) {
    // make plain version, e.g. pat._add(value) adds that plain value
    // to all the values in pat
    Pattern.prototype['_' + what] = function (value) {
      return this.fmap((x) => op(x, value));
    };

    // make patternified monster version
    Object.defineProperty(Pattern.prototype, what, {
      // a getter that returns a function, so 'pat' can be
      // accessed by closures that are methods of that function..
      get: function () {
        const pat = this;

        // wrap the 'in' function as default behaviour
        const wrapper = (...other) => pat[what]['in'](...other);

        // add methods to that function for each behaviour
        for (const how of hows) {
          wrapper[how.toLowerCase()] = function (...other) {
            var howpat = pat;
            other = sequence(other);
            if (preprocess) {
              howpat = preprocess(howpat);
              other = preprocess(other);
            }
            var result;
            // hack to remove undefs when doing 'keepif'
            if (what === 'keepif') {
              // avoid union, as we want to throw away the value of 'b' completely
              result = howpat['_op' + how](other, (a) => (b) => op(a, b));
              result = result.removeUndefineds();
            } else {
              result = howpat['_op' + how](other, (a) => (b) => _composeOp(a, b, op));
            }
            return result;
          };
        }
        wrapper.squeezein = wrapper.squeeze;

        return wrapper;
      },
    });

    // Default op to 'set', e.g. pat.squeeze(pat2) = pat.set.squeeze(pat2)
    for (const how of hows) {
      Pattern.prototype[how.toLowerCase()] = function (...args) {
        return this.set[how.toLowerCase()](args);
      };
    }
  }

  // binary composers
  /**
   * Applies the given structure to the pattern:
   *
   * @example
   * note("c,eb,g")
   *   .struct("x ~ x ~ ~ x ~ x ~ ~ ~ x ~ x ~ ~")
   *   .slow(2)
   */
  Pattern.prototype.struct = function (...args) {
    return this.keepif.out(...args);
  };
  Pattern.prototype.structAll = function (...args) {
    return this.keep.out(...args);
  };
  /**
   * Returns silence when mask is 0 or "~"
   *
   * @example
   * note("c [eb,g] d [eb,g]").mask("<1 [0 1]>")
   */
  Pattern.prototype.mask = function (...args) {
    return this.keepif.in(...args);
  };
  Pattern.prototype.maskAll = function (...args) {
    return this.keep.in(...args);
  };
  /**
   * Resets the pattern to the start of the cycle for each onset of the reset pattern.
   *
   * @example
   * s("[<bd lt> sd]*2, hh*8").reset("<x@3 x(5,8)>")
   */
  Pattern.prototype.reset = function (...args) {
    return this.keepif.reset(...args);
  };
  Pattern.prototype.resetAll = function (...args) {
    return this.keep.reset(...args);
  };
  /**
   * Restarts the pattern for each onset of the restart pattern.
   * While reset will only reset the current cycle, restart will start from cycle 0.
   *
   * @example
   * s("[<bd lt> sd]*2, hh*8").restart("<x@3 x(5,8)>")
   */
  Pattern.prototype.restart = function (...args) {
    return this.keepif.restart(...args);
  };
  Pattern.prototype.restartAll = function (...args) {
    return this.keep.restart(...args);
  };
})();

// aliases
export const polyrhythm = stack;
export const pr = stack;

export const pm = s_polymeter;

// methods that create patterns, which are added to patternified Pattern methods
// TODO: remove? this is only used in old transpiler (shapeshifter)
// Pattern.prototype.factories = {
//   pure,
//   stack,
//   slowcat,
//   fastcat,
//   cat,
//   timecat,
//   sequence,
//   seq,
//   polymeter,
//   pm,
//   polyrhythm,
//   pr,
// };
// the magic happens in Pattern constructor. Keeping this in prototype enables adding methods from the outside (e.g. see tonal.ts)

// Elemental patterns

/**
 * Does absolutely nothing, but with a given metrical 'tactus'
 * @name gap
 * @param  {number} tactus
 * @example
 * gap(3) // "~@3"
 */
export const gap = (tactus) => new Pattern(() => [], tactus);

/**
 * Does absolutely nothing..
 * @name silence
 * @example
 * silence // "~"
 */
export const silence = gap(1);

/* Like silence, but with a 'tactus' (relative duration) of 0 */
export const nothing = gap(0);

/** A discrete value that repeats once per cycle.
 *
 * @returns {Pattern}
 * @example
 * pure('e4') // "e4"
 * @noAutocomplete
 */
export function pure(value) {
  function query(state) {
    return state.span.spanCycles.map((subspan) => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value));
  }
  const result = new Pattern(query, 1);
  result.__pure = value;
  return result;
}

export function isPattern(thing) {
  // thing?.constructor?.name !== 'Pattern' // <- this will fail when code is mangled
  const is = thing instanceof Pattern || thing?._Pattern;
  // TODO: find out how to check wrong core dependency. below will never work !thing === 'undefined'
  // wrapping it in (..) will result other checks to log that warning (e.g. isPattern('kalimba'))
  /* if (!thing instanceof Pattern) {
    console.warn(
      `Found Pattern that fails "instanceof Pattern" check.
      This may happen if you are using multiple versions of @strudel/core.
      Please check by running "npm ls @strudel/core".`,
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
 * @synonyms polyrhythm, pr
 * @example
 * stack("g3", "b3", ["e4", "d4"]).note()
 * // "g3,b3,[e4,d4]".note()
 *
 * @example
 * // As a chained function:
 * s("hh*4").stack(
 *   note("c4(5,8)")
 * )
 */
export function stack(...pats) {
  // Array test here is to avoid infinite recursions..
  pats = pats.map((pat) => (Array.isArray(pat) ? sequence(...pat) : reify(pat)));
  const query = (state) => flatten(pats.map((pat) => pat.query(state)));
  const result = new Pattern(query);
  if (__tactus) {
    result.tactus = lcm(...pats.map((pat) => pat.tactus));
  }
  return result;
}

function _stackWith(func, pats) {
  pats = pats.map((pat) => (Array.isArray(pat) ? sequence(...pat) : reify(pat)));
  if (pats.length === 0) {
    return silence;
  }
  if (pats.length === 1) {
    return pats[0];
  }
  const [left, ...right] = pats.map((pat) => pat.tactus);
  const tactus = __tactus ? left.maximum(...right) : undefined;
  return stack(...func(tactus, pats));
}

export function stackLeft(...pats) {
  return _stackWith(
    (tactus, pats) => pats.map((pat) => (pat.tactus.eq(tactus) ? pat : s_cat(pat, gap(tactus.sub(pat.tactus))))),
    pats,
  );
}

export function stackRight(...pats) {
  return _stackWith(
    (tactus, pats) => pats.map((pat) => (pat.tactus.eq(tactus) ? pat : s_cat(gap(tactus.sub(pat.tactus)), pat))),
    pats,
  );
}

export function stackCentre(...pats) {
  return _stackWith(
    (tactus, pats) =>
      pats.map((pat) => {
        if (pat.tactus.eq(tactus)) {
          return pat;
        }
        const g = gap(tactus.sub(pat.tactus).div(2));
        return s_cat(g, pat, g);
      }),
    pats,
  );
}

export function stackBy(by, ...pats) {
  const [left, ...right] = pats.map((pat) => pat.tactus);
  const tactus = left.maximum(...right);
  const lookup = {
    centre: stackCentre,
    left: stackLeft,
    right: stackRight,
    expand: stack,
    repeat: (...args) => s_polymeterSteps(tactus, ...args),
  };
  return by
    .inhabit(lookup)
    .fmap((func) => func(...pats))
    .innerJoin()
    .setTactus(tactus);
}

/** Concatenation: combines a list of patterns, switching between them successively, one per cycle:
 *
 * synonyms: `cat`
 *
 * @return {Pattern}
 * @example
 * slowcat("e5", "b4", ["d5", "c5"])
 *
 */
export function slowcat(...pats) {
  // Array test here is to avoid infinite recursions..
  pats = pats.map((pat) => (Array.isArray(pat) ? fastcat(...pat) : reify(pat)));

  if (pats.length == 1) {
    return pats[0];
  }

  const query = function (state) {
    const span = state.span;
    const pat_n = _mod(span.begin.sam(), pats.length);
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
  const tactus = __tactus ? lcm(...pats.map((x) => x.tactus)) : undefined;
  return new Pattern(query).splitQueries().setTactus(tactus);
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

/** The given items are con**cat**enated, where each one takes one cycle.
 *
 * @param {...any} items - The items to concatenate
 * @synonyms slowcat
 * @return {Pattern}
 * @example
 * cat("e5", "b4", ["d5", "c5"]).note()
 * // "<e5 b4 [d5 c5]>".note()
 *
 * @example
 * // As a chained function:
 * s("hh*4").cat(
 *    note("c4(5,8)")
 * )
 */
export function cat(...pats) {
  return slowcat(...pats);
}

/**
 * Allows to arrange multiple patterns together over multiple cycles.
 * Takes a variable number of arrays with two elements specifying the number of cycles and the pattern to use.
 *
 * @return {Pattern}
 * @example
 * arrange(
 *   [4, "<c a f e>(3,8)"],
 *   [2, "<g a>(5,8)"]
 * ).note()
 */
export function arrange(...sections) {
  const total = sections.reduce((sum, [cycles]) => sum + cycles, 0);
  sections = sections.map(([cycles, section]) => [cycles, section.fast(cycles)]);
  return s_cat(...sections).slow(total);
}

/**
 * Similarly to `arrange`, allows you to arrange multiple patterns together over multiple cycles.
 * Unlike `arrange`, you specify a start and stop time for each pattern rather than duration, which
 * means that patterns can overlap.
 * @return {Pattern}
 * @example
seqPLoop([0, 2, "bd(3,8)"],
         [1, 3, "cp(3,8)"]
        )
  .sound()
 */
export function seqPLoop(...parts) {
  let total = Fraction(0);
  const pats = [];
  for (let part of parts) {
    if (part.length == 2) {
      part.unshift(total);
    }
    total = part[1];
  }

  return stack(
    ...parts.map(([start, stop, pat]) =>
      pure(reify(pat)).compress(Fraction(start).div(total), Fraction(stop).div(total)),
    ),
  )
    .slow(total)
    .innerJoin(); // or resetJoin or restartJoin ??
}

export function fastcat(...pats) {
  let result = slowcat(...pats);
  if (pats.length > 1) {
    result = result._fast(pats.length);
    result.tactus = pats.length;
  }
  if (pats.length == 1 && pats[0].__tactus_source) {
    pats.tactus = pats[0].tactus;
  }
  return result;
}

/** See `fastcat` */
export function sequence(...pats) {
  return fastcat(...pats);
}

/** Like **cat**, but the items are crammed into one cycle.
 * @synonyms sequence, fastcat
 * @example
 * seq("e5", "b4", ["d5", "c5"]).note()
 * // "e5 b4 [d5 c5]".note()
 *
 * @example
 * // As a chained function:
 * s("hh*4").seq(
 *   note("c4(5,8)")
 * )
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

export const mask = curry((a, b) => reify(b).mask(a));
export const struct = curry((a, b) => reify(b).struct(a));
export const superimpose = curry((a, b) => reify(b).superimpose(...a));

// operators
export const set = curry((a, b) => reify(b).set(a));
export const keep = curry((a, b) => reify(b).keep(a));
export const keepif = curry((a, b) => reify(b).keepif(a));
export const add = curry((a, b) => reify(b).add(a));
export const sub = curry((a, b) => reify(b).sub(a));
export const mul = curry((a, b) => reify(b).mul(a));
export const div = curry((a, b) => reify(b).div(a));
export const mod = curry((a, b) => reify(b).mod(a));
export const pow = curry((a, b) => reify(b).pow(a));
export const band = curry((a, b) => reify(b).band(a));
export const bor = curry((a, b) => reify(b).bor(a));
export const bxor = curry((a, b) => reify(b).bxor(a));
export const blshift = curry((a, b) => reify(b).blshift(a));
export const brshift = curry((a, b) => reify(b).brshift(a));
export const lt = curry((a, b) => reify(b).lt(a));
export const gt = curry((a, b) => reify(b).gt(a));
export const lte = curry((a, b) => reify(b).lte(a));
export const gte = curry((a, b) => reify(b).gte(a));
export const eq = curry((a, b) => reify(b).eq(a));
export const eqt = curry((a, b) => reify(b).eqt(a));
export const ne = curry((a, b) => reify(b).ne(a));
export const net = curry((a, b) => reify(b).net(a));
export const and = curry((a, b) => reify(b).and(a));
export const or = curry((a, b) => reify(b).or(a));
export const func = curry((a, b) => reify(b).func(a));

/**
 * Registers a new pattern method. The method is added to the Pattern class + the standalone function is returned from register.
 *
 * @param {string} name name of the function
 * @param {function} func function with 1 or more params, where last is the current pattern
 * @noAutocomplete
 *
 */
export function register(name, func, patternify = true, preserveTactus = false, join = (x) => x.innerJoin()) {
  if (Array.isArray(name)) {
    const result = {};
    for (const name_item of name) {
      result[name_item] = register(name_item, func, patternify);
    }
    return result;
  }
  const arity = func.length;
  var pfunc; // the patternified function

  if (patternify) {
    pfunc = function (...args) {
      args = args.map(reify);
      const pat = args[args.length - 1];
      let result;

      if (arity === 1) {
        result = func(pat);
      } else {
        const firstArgs = args.slice(0, -1);

        if (firstArgs.every((arg) => arg.__pure != undefined)) {
          const pureArgs = firstArgs.map((arg) => arg.__pure);
          const pureLocs = firstArgs.filter((arg) => arg.__pure_loc).map((arg) => arg.__pure_loc);
          result = func(...pureArgs, pat);
          result = result.withContext((context) => {
            const locations = (context.locations || []).concat(pureLocs);
            return { ...context, locations };
          });
        } else {
          const [left, ...right] = firstArgs;

          let mapFn = (...args) => {
            return func(...args, pat);
          };
          mapFn = curry(mapFn, null, arity - 1);
          result = join(right.reduce((acc, p) => acc.appLeft(p), left.fmap(mapFn)));
        }
      }
      if (preserveTactus) {
        result.tactus = pat.tactus;
      }
      return result;
    };
  } else {
    pfunc = function (...args) {
      args = args.map(reify);
      const result = func(...args);
      if (preserveTactus) {
        result.tactus = args[args.length - 1].tactus;
      }
      return result;
    };
  }

  Pattern.prototype[name] = function (...args) {
    // For methods that take a single argument (plus 'this'), allow
    // multiple arguments but sequence them
    if (arity === 2 && args.length !== 1) {
      args = [sequence(...args)];
    } else if (arity !== args.length + 1) {
      throw new Error(`.${name}() expects ${arity - 1} inputs but got ${args.length}.`);
    }
    args = args.map(reify);
    return pfunc(...args, this);
  };

  if (arity > 1) {
    // There are patternified args, so lets make an unpatternified
    // version, prefixed by '_'
    Pattern.prototype['_' + name] = function (...args) {
      const result = func(...args, this);
      if (preserveTactus) {
        result.setTactus(this.tactus);
      }
      return result;
    };
  }

  // toplevel functions get curried as well as patternified
  // because pfunc uses spread args, we need to state the arity explicitly!
  return curry(pfunc, null, arity);
}

// Like register, but defaults to stepJoin
function stepRegister(name, func, patternify = true, preserveTactus = false, join = (x) => x.stepJoin()) {
  return register(name, func, patternify, preserveTactus, join);
}

//////////////////////////////////////////////////////////////////////
// Numerical transformations

/**
 * Assumes a numerical pattern. Returns a new pattern with all values rounded
 * to the nearest integer.
 * @name round
 * @memberof Pattern
 * @returns Pattern
 * @example
 * n("0.5 1.5 2.5".round()).scale("C:major")
 */
export const round = register('round', function (pat) {
  return pat.asNumber().fmap((v) => Math.round(v));
});

/**
 * Assumes a numerical pattern. Returns a new pattern with all values set to
 * their mathematical floor. E.g. `3.7` replaced with to `3`, and `-4.2`
 * replaced with `-5`.
 * @name floor
 * @memberof Pattern
 * @returns Pattern
 * @example
 * note("42 42.1 42.5 43".floor())
 */
export const floor = register('floor', function (pat) {
  return pat.asNumber().fmap((v) => Math.floor(v));
});

/**
 * Assumes a numerical pattern. Returns a new pattern with all values set to
 * their mathematical ceiling. E.g. `3.2` replaced with `4`, and `-4.2`
 * replaced with `-4`.
 * @name ceil
 * @memberof Pattern
 * @returns Pattern
 * @example
 * note("42 42.1 42.5 43".ceil())
 */
export const ceil = register('ceil', function (pat) {
  return pat.asNumber().fmap((v) => Math.ceil(v));
});
/**
 * Assumes a numerical pattern, containing unipolar values in the range 0 ..
 * 1. Returns a new pattern with values scaled to the bipolar range -1 .. 1
 * @returns Pattern
 * @noAutocomplete
 */
export const toBipolar = register('toBipolar', function (pat) {
  return pat.fmap((x) => x * 2 - 1);
});

/**
 * Assumes a numerical pattern, containing bipolar values in the range -1 .. 1
 * Returns a new pattern with values scaled to the unipolar range 0 .. 1
 * @returns Pattern
 * @noAutocomplete
 */
export const fromBipolar = register('fromBipolar', function (pat) {
  return pat.fmap((x) => (x + 1) / 2);
});

/**
 * Assumes a numerical pattern, containing unipolar values in the range 0 .. 1.
 * Returns a new pattern with values scaled to the given min/max range.
 * Most useful in combination with continuous patterns.
 * @name range
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("[bd sd]*2,hh*8")
 * .cutoff(sine.range(500,4000))
 */
export const range = register('range', function (min, max, pat) {
  return pat.mul(max - min).add(min);
});

/**
 * Assumes a numerical pattern, containing unipolar values in the range 0 .. 1
 * Returns a new pattern with values scaled to the given min/max range,
 * following an exponential curve.
 * @name rangex
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("[bd sd]*2,hh*8")
 * .cutoff(sine.rangex(500,4000))
 */
export const rangex = register('rangex', function (min, max, pat) {
  return pat._range(Math.log(min), Math.log(max)).fmap(Math.exp);
});

/**
 * Assumes a numerical pattern, containing bipolar values in the range -1 .. 1
 * Returns a new pattern with values scaled to the given min/max range.
 * @name range2
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("[bd sd]*2,hh*8")
 * .cutoff(sine2.range2(500,4000))
 */
export const range2 = register('range2', function (min, max, pat) {
  return pat.fromBipolar()._range(min, max);
});

/**
 * Allows dividing numbers via list notation using ":".
 * Returns a new pattern with just numbers.
 * @name ratio
 * @memberof Pattern
 * @returns Pattern
 * @example
 * ratio("1, 5:4, 3:2").mul(110)
 * .freq().s("piano")
 */
export const ratio = register('ratio', (pat) =>
  pat.fmap((v) => {
    if (!Array.isArray(v)) {
      return v;
    }
    return v.slice(1).reduce((acc, n) => acc / n, v[0]);
  }),
);

//////////////////////////////////////////////////////////////////////
// Structural and temporal transformations

/** Compress each cycle into the given timespan, leaving a gap
 * @example
 * cat(
 *   s("bd sd").compress(.25,.75),
 *   s("~ bd sd ~")
 * )
 */
export const compress = register('compress', function (b, e, pat) {
  b = Fraction(b);
  e = Fraction(e);
  if (b.gt(e) || b.gt(1) || e.gt(1) || b.lt(0) || e.lt(0)) {
    return silence;
  }
  return pat._fastGap(Fraction(1).div(e.sub(b)))._late(b);
});

export const { compressSpan, compressspan } = register(['compressSpan', 'compressspan'], function (span, pat) {
  return pat._compress(span.begin, span.end);
});

/**
 * speeds up a pattern like fast, but rather than it playing multiple times as fast would it instead leaves a gap in the remaining space of the cycle. For example, the following will play the sound pattern "bd sn" only once but compressed into the first half of the cycle, i.e. twice as fast.
 * @name fastGap
 * @synonyms fastgap
 * @example
 * s("bd sd").fastGap(2)
 */
export const { fastGap, fastgap } = register(['fastGap', 'fastgap'], function (factor, pat) {
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
  return pat.withQuerySpanMaybe(qf).withHap(ef).splitQueries();
});

/**
 * Similar to `compress`, but doesn't leave gaps, and the 'focus' can be bigger than a cycle
 * @example
 * s("bd hh sd hh").focus(1/4, 3/4)
 */
export const focus = register('focus', function (b, e, pat) {
  b = Fraction(b);
  e = Fraction(e);
  return pat._fast(Fraction(1).div(e.sub(b))).late(b.cyclePos());
});

export const { focusSpan, focusspan } = register(['focusSpan', 'focusspan'], function (span, pat) {
  return pat._focus(span.begin, span.end);
});

/** The ply function repeats each event the given number of times.
 * @example
 * s("bd ~ sd cp").ply("<1 2 3>")
 */
export const ply = register('ply', function (factor, pat) {
  const result = pat.fmap((x) => pure(x)._fast(factor)).squeezeJoin();
  if (__tactus) {
    result.tactus = Fraction(factor).mulmaybe(pat.tactus);
  }
  return result;
});

/**
 * Speed up a pattern by the given factor. Used by "*" in mini notation.
 *
 * @name fast
 * @synonyms density
 * @memberof Pattern
 * @param {number | Pattern} factor speed up factor
 * @returns Pattern
 * @example
 * s("bd hh sd hh").fast(2) // s("[bd hh sd hh]*2")
 */
export const { fast, density } = register(
  ['fast', 'density'],
  function (factor, pat) {
    if (factor === 0) {
      return silence;
    }
    factor = Fraction(factor);
    const fastQuery = pat.withQueryTime((t) => t.mul(factor));
    return fastQuery.withHapTime((t) => t.div(factor)).setTactus(pat.tactus);
  },
  true,
  true,
);

/**
 * Both speeds up the pattern (like 'fast') and the sample playback (like 'speed').
 * @example
 * s("bd sd:2").hurry("<1 2 4 3>").slow(1.5)
 */
export const hurry = register('hurry', function (r, pat) {
  return pat._fast(r).mul(pure({ speed: r }));
});

/**
 * Slow down a pattern over the given number of cycles. Like the "/" operator in mini notation.
 *
 * @name slow
 * @synonyms sparsity
 * @memberof Pattern
 * @param {number | Pattern} factor slow down factor
 * @returns Pattern
 * @example
 * s("bd hh sd hh").slow(2) // s("[bd hh sd hh]/2")
 */
export const { slow, sparsity } = register(['slow', 'sparsity'], function (factor, pat) {
  if (factor === 0) {
    return silence;
  }
  return pat._fast(Fraction(1).div(factor));
});

/**
 * Carries out an operation 'inside' a cycle.
 * @example
 * "0 1 2 3 4 3 2 1".inside(4, rev).scale('C major').note()
 * // "0 1 2 3 4 3 2 1".slow(4).rev().fast(4).scale('C major').note()
 */
export const inside = register('inside', function (factor, f, pat) {
  return f(pat._slow(factor))._fast(factor);
});

/**
 * Carries out an operation 'outside' a cycle.
 * @example
 * "<[0 1] 2 [3 4] 5>".outside(4, rev).scale('C major').note()
 * // "<[0 1] 2 [3 4] 5>".fast(4).rev().slow(4).scale('C major').note()
 */
export const outside = register('outside', function (factor, f, pat) {
  return f(pat._fast(factor))._slow(factor);
});

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
export const lastOf = register('lastOf', function (n, func, pat) {
  const pats = Array(n - 1).fill(pat);
  pats.push(func(pat));
  return slowcatPrime(...pats);
});

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

/**
 * An alias for `firstOf`
 * @name every
 * @memberof Pattern
 * @param {number} n how many cycles
 * @param {function} func function to apply
 * @returns Pattern
 * @example
 * note("c3 d3 e3 g3").every(4, x=>x.rev())
 */
export const { firstOf, every } = register(['firstOf', 'every'], function (n, func, pat) {
  const pats = Array(n - 1).fill(pat);
  pats.unshift(func(pat));
  return slowcatPrime(...pats);
});

/**
 * Like layer, but with a single function:
 * @name apply
 * @memberof Pattern
 * @example
 * "<c3 eb3 g3>".scale('C minor').apply(scaleTranspose("0,2,4")).note()
 */
// TODO: remove or dedupe with layer?
export const apply = register('apply', function (func, pat) {
  return func(pat);
});

/**
 * Plays the pattern at the given cycles per minute.
 * @example
 * s("<bd sd>,hh*2").cpm(90) // = 90 bpm
 */
// this is redefined in repl.mjs, using the current cps as divisor
export const cpm = register('cpm', function (cpm, pat) {
  return pat._fast(cpm / 60 / 1);
});

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
export const early = register(
  'early',
  function (offset, pat) {
    offset = Fraction(offset);
    return pat.withQueryTime((t) => t.add(offset)).withHapTime((t) => t.sub(offset));
  },
  true,
  true,
);

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
export const late = register(
  'late',
  function (offset, pat) {
    offset = Fraction(offset);
    return pat._early(Fraction(0).sub(offset));
  },
  true,
  true,
);

/**
 * Plays a portion of a pattern, specified by the beginning and end of a time span. The new resulting pattern is played over the time period of the original pattern:
 *
 * @example
 * s("bd*2 hh*3 [sd bd]*2 perc").zoom(0.25, 0.75)
 * // s("hh*3 [sd bd]*2") // equivalent
 */
export const zoom = register('zoom', function (s, e, pat) {
  e = Fraction(e);
  s = Fraction(s);
  if (s.gte(e)) {
    return nothing;
  }
  const d = e.sub(s);
  const tactus = __tactus ? pat.tactus.mulmaybe(d) : undefined;
  return pat
    .withQuerySpan((span) => span.withCycle((t) => t.mul(d).add(s)))
    .withHapSpan((span) => span.withCycle((t) => t.sub(s).div(d)))
    .splitQueries()
    .setTactus(tactus);
});

export const { zoomArc, zoomarc } = register(['zoomArc', 'zoomarc'], function (a, pat) {
  return pat.zoom(a.begin, a.end);
});

/**
 * Splits a pattern into the given number of slices, and plays them according to a pattern of slice numbers.
 * Similar to `slice`, but slices up patterns rather than sound samples.
 * @param {number} number of slices
 * @param {number} slices to play
 * @example
 * note("0 1 2 3 4 5 6 7".scale('c:mixolydian'))
 *.bite(4, "3 2 1 0")
 * @example
 * sound("bd - bd bd*2, - sd:6 - sd:5 sd:1 - [- sd:2] -, hh [- cp:7]")
  .bank("RolandTR909").speed(1.2)
  .bite(4, "0 0 [1 2] <3 2> 0 0 [2 1] 3")
 */
export const bite = register(
  'bite',
  (npat, ipat, pat) => {
    return ipat
      .fmap((i) => (n) => {
        const a = Fraction(i).div(n).mod(1);
        const b = a.add(Fraction(1).div(n));
        return pat.zoom(a, b);
      })
      .appLeft(npat)
      .squeezeJoin();
  },
  false,
);

/**
 * Selects the given fraction of the pattern and repeats that part to fill the remainder of the cycle.
 * @param {number} fraction fraction to select
 * @example
 * s("lt ht mt cp, [hh oh]*2").linger("<1 .5 .25 .125>")
 */
export const linger = register(
  'linger',
  function (t, pat) {
    if (t == 0) {
      return silence;
    } else if (t < 0) {
      return pat._zoom(t.add(1), 1)._slow(t);
    }
    return pat._zoom(0, t)._slow(t);
  },
  true,
  true,
);

/**
 * Samples the pattern at a rate of n events per cycle. Useful for turning a continuous pattern into a discrete one.
 * @param {number} segments number of segments per cycle
 * @example
 * note(saw.range(40,52).segment(24))
 */
export const segment = register('segment', function (rate, pat) {
  return pat.struct(pure(true)._fast(rate)).setTactus(rate);
});

/**
 * The function `swingBy x n` breaks each cycle into `n` slices, and then delays events in the second half of each slice by the amount `x`, which is relative to the size of the (half) slice. So if `x` is 0 it does nothing, `0.5` delays for half the note duration, and 1 will wrap around to doing nothing again. The end result is a shuffle or swing-like rhythm
 * @param {number} subdivision
 * @param {number} offset
 * @example
 * s("hh*8").swingBy(1/3, 4)
 */
export const swingBy = register('swingBy', (swing, n, pat) => pat.inside(n, late(seq(0, swing / 2))));

/**
 * Shorthand for swingBy with 1/3:
 * @param {number} subdivision
 * @example
 * s("hh*8").swing(4)
 * // s("hh*8").swingBy(1/3, 4)
 */
export const swing = register('swing', (n, pat) => pat.swingBy(1 / 3, n));

/**
 * Swaps 1s and 0s in a binary pattern.
 * @name invert
 * @synonyms inv
 * @example
 * s("bd").struct("1 0 0 1 0 0 1 0".lastOf(4, invert))
 */
export const { invert, inv } = register(
  ['invert', 'inv'],
  function (pat) {
    // Swap true/false in a binary pattern
    return pat.fmap((x) => !x);
  },
  true,
  true,
);

/**
 * Applies the given function whenever the given pattern is in a true state.
 * @name when
 * @memberof Pattern
 * @param {Pattern} binary_pat
 * @param {function} func
 * @returns Pattern
 * @example
 * "c3 eb3 g3".when("<0 1>/2", x=>x.sub("5")).note()
 */
export const when = register('when', function (on, func, pat) {
  return on ? func(pat) : pat;
});

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
export const off = register('off', function (time_pat, func, pat) {
  return stack(pat, func(pat.late(time_pat)));
});

/**
 * Returns a new pattern where every other cycle is played once, twice as
 * fast, and offset in time by one quarter of a cycle. Creates a kind of
 * breakbeat feel.
 * @returns Pattern
 */
export const brak = register('brak', function (pat) {
  return pat.when(slowcat(false, true), (x) => fastcat(x, silence)._late(0.25));
});

/**
 * Reverse all haps in a pattern
 *
 * @name rev
 * @memberof Pattern
 * @returns Pattern
 * @example
 * note("c d e g").rev()
 */
export const rev = register(
  'rev',
  function (pat) {
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
  },
  false,
  true,
);

/** Like press, but allows you to specify the amount by which each
 * event is shifted. pressBy(0.5) is the same as press, while
 * pressBy(1/3) shifts each event by a third of its timespan.
 * @example
 * stack(s("hh*4"),
 *       s("bd mt sd ht").pressBy("<0 0.5 0.25>")
 *      ).slow(2)
 */
export const pressBy = register('pressBy', function (r, pat) {
  return pat.fmap((x) => pure(x).compress(r, 1)).squeezeJoin();
});

/**
 * Syncopates a rhythm, by shifting each event halfway into its timespan.
 * @example
 * stack(s("hh*4"),
 *       s("bd mt sd ht").every(4, press)
 *      ).slow(2)
 */
export const press = register('press', function (pat) {
  return pat._pressBy(0.5);
});

/**
 * Silences a pattern.
 * @example
 * stack(
 *   s("bd").hush(),
 *   s("hh*3")
 * )
 */
Pattern.prototype.hush = function () {
  return silence;
};

/**
 * Applies `rev` to a pattern every other cycle, so that the pattern alternates between forwards and backwards.
 * @example
 * note("c d e g").palindrome()
 */
export const palindrome = register(
  'palindrome',
  function (pat) {
    return pat.lastOf(2, rev);
  },
  true,
  true,
);

/**
 * Jux with adjustable stereo width. 0 = mono, 1 = full stereo.
 * @name juxBy
 * @synonyms juxby
 * @example
 * s("bd lt [~ ht] mt cp ~ bd hh").juxBy("<0 .5 1>/2", rev)
 */
export const { juxBy, juxby } = register(['juxBy', 'juxby'], function (by, func, pat) {
  by /= 2;
  const elem_or = function (dict, key, dflt) {
    if (key in dict) {
      return dict[key];
    }
    return dflt;
  };
  const left = pat.withValue((val) => Object.assign({}, val, { pan: elem_or(val, 'pan', 0.5) - by }));
  const right = func(pat.withValue((val) => Object.assign({}, val, { pan: elem_or(val, 'pan', 0.5) + by })));

  return stack(left, right).setTactus(__tactus ? lcm(left.tactus, right.tactus) : undefined);
});

/**
 * The jux function creates strange stereo effects, by applying a function to a pattern, but only in the right-hand channel.
 * @example
 * s("bd lt [~ ht] mt cp ~ bd hh").jux(rev)
 * @example
 * s("bd lt [~ ht] mt cp ~ bd hh").jux(press)
 * @example
 * s("bd lt [~ ht] mt cp ~ bd hh").jux(iter(4))
 */
export const jux = register('jux', function (func, pat) {
  return pat._juxBy(1, func, pat);
});

/**
 * Superimpose and offset multiple times, applying the given function each time.
 * @name echoWith
 * @synonyms echowith, stutWith, stutwith
 * @param {number} times how many times to repeat
 * @param {number} time cycle offset between iterations
 * @param {function} func function to apply, given the pattern and the iteration index
 * @example
 * "<0 [2 4]>"
 * .echoWith(4, 1/8, (p,n) => p.add(n*2))
 * .scale("C:minor").note()
 */
export const { echoWith, echowith, stutWith, stutwith } = register(
  ['echoWith', 'echowith', 'stutWith', 'stutwith'],
  function (times, time, func, pat) {
    return stack(...listRange(0, times - 1).map((i) => func(pat.late(Fraction(time).mul(i)), i)));
  },
);

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
export const echo = register('echo', function (times, time, feedback, pat) {
  return pat._echoWith(times, time, (pat, i) => pat.gain(Math.pow(feedback, i)));
});

/**
 * Deprecated. Like echo, but the last 2 parameters are flipped.
 * @name stut
 * @param {number} times how many times to repeat
 * @param {number} feedback velocity multiplicator for each iteration
 * @param {number} time cycle offset between iterations
 * @example
 * s("bd sd").stut(3, .8, 1/6)
 */
export const stut = register('stut', function (times, feedback, time, pat) {
  return pat._echoWith(times, time, (pat, i) => pat.gain(Math.pow(feedback, i)));
});

/**
 * Divides a pattern into a given number of subdivisions, plays the subdivisions in order, but increments the starting subdivision each cycle. The pattern wraps to the first subdivision after the last subdivision is played.
 * @name iter
 * @memberof Pattern
 * @returns Pattern
 * @example
 * note("0 1 2 3".scale('A minor')).iter(4)
 */

const _iter = function (times, pat, back = false) {
  times = Fraction(times);
  return slowcat(
    ...listRange(0, times.sub(1)).map((i) =>
      back ? pat.late(Fraction(i).div(times)) : pat.early(Fraction(i).div(times)),
    ),
  );
};

export const iter = register(
  'iter',
  function (times, pat) {
    return _iter(times, pat, false);
  },
  true,
  true,
);

/**
 * Like `iter`, but plays the subdivisions in reverse order. Known as iter' in tidalcycles
 * @name iterBack
 * @synonyms iterback
 * @memberof Pattern
 * @returns Pattern
 * @example
 * note("0 1 2 3".scale('A minor')).iterBack(4)
 */
export const { iterBack, iterback } = register(
  ['iterBack', 'iterback'],
  function (times, pat) {
    return _iter(times, pat, true);
  },
  true,
  true,
);

/**
 * Repeats each cycle the given number of times.
 * @name repeatCycles
 * @memberof Pattern
 * @returns Pattern
 * @example
 * note(irand(12).add(34)).segment(4).repeatCycles(2).s("gm_acoustic_guitar_nylon")
 */
export const { repeatCycles } = register(
  'repeatCycles',
  function (n, pat) {
    return new Pattern(function (state) {
      const cycle = state.span.begin.sam();
      const source_cycle = cycle.div(n).sam();
      const delta = cycle.sub(source_cycle);
      state = state.withSpan((span) => span.withTime((spant) => spant.sub(delta)));
      return pat.query(state).map((hap) => hap.withSpan((span) => span.withTime((spant) => spant.add(delta))));
    }).splitQueries();
  },
  true,
  true,
);

/**
 * Divides a pattern into a given number of parts, then cycles through those parts in turn, applying the given function to each part in turn (one part per cycle).
 * @name chunk
 * @synonyms slowChunk, slowchunk
 * @memberof Pattern
 * @returns Pattern
 * @example
 * "0 1 2 3".chunk(4, x=>x.add(7))
 * .scale("A:minor").note()
 */
const _chunk = function (n, func, pat, back = false, fast = false) {
  const binary = Array(n - 1).fill(false);
  binary.unshift(true);
  // Invert the 'back' because we want to shift the pattern forwards,
  // and so time backwards
  const binary_pat = _iter(n, sequence(...binary), !back);
  if (!fast) {
    pat = pat.repeatCycles(n);
  }
  return pat.when(binary_pat, func);
};

export const { chunk, slowchunk, slowChunk } = register(['chunk', 'slowchunk', 'slowChunk'], function (n, func, pat) {
  return _chunk(n, func, pat, false, false);
});

/**
 * Like `chunk`, but cycles through the parts in reverse order. Known as chunk' in tidalcycles
 * @name chunkBack
 * @synonyms chunkback
 * @memberof Pattern
 * @returns Pattern
 * @example
 * "0 1 2 3".chunkBack(4, x=>x.add(7))
 * .scale("A:minor").note()
 */
export const { chunkBack, chunkback } = register(['chunkBack', 'chunkback'], function (n, func, pat) {
  return _chunk(n, func, pat, true);
});

/**
 * Like `chunk`, but the cycles of the source pattern aren't repeated
 * for each set of chunks.
 * @name fastChunk
 * @synonyms fastchunk
 * @memberof Pattern
 * @returns Pattern
 * @example
 * "<0 8> 1 2 3 4 5 6 7"
 * .fastChunk(4, x => x.color('red')).slow(2)
 * .scale("C2:major").note()
 */
export const { fastchunk, fastChunk } = register(['fastchunk', 'fastChunk'], function (n, func, pat) {
  return _chunk(n, func, pat, false, true);
});

// TODO - redefine elsewhere in terms of mask
export const bypass = register(
  'bypass',
  function (on, pat) {
    on = Boolean(parseInt(on));
    return on ? silence : pat;
  },
  true,
  true,
);

/**
 * Loops the pattern inside at `offset` for `cycles`.
 * @param {number} offset start point of loop in cycles
 * @param {number} cycles loop length in cycles
 * @example
 * note("<c d e f>").ribbon(1, 2).fast(2)
 * @example
 * // Looping a portion of randomness
 * note(irand(8).segment(4).scale('C3 minor')).ribbon(1337, 2)
 */
export const ribbon = register('ribbon', (offset, cycles, pat) => pat.early(offset).restart(pure(1).slow(cycles)));

export const hsla = register('hsla', (h, s, l, a, pat) => {
  return pat.color(`hsla(${h}turn,${s * 100}%,${l * 100}%,${a})`);
});

export const hsl = register('hsl', (h, s, l, pat) => {
  return pat.color(`hsl(${h}turn,${s * 100}%,${l * 100}%)`);
});

/**
 * Tags each Hap with an identifier. Good for filtering. The function populates Hap.context.tags (Array).
 * @name tag
 * @noAutocomplete
 * @param {string} tag anything unique
 */
Pattern.prototype.tag = function (tag) {
  return this.withContext((ctx) => ({ ...ctx, tags: (ctx.tags || []).concat([tag]) }));
};

/**
 * Filters haps using the given function
 * @name filter
 * @param {Function} test function to test Hap
 * @example
 * s("hh!7 oh").filter(hap => hap.value.s==='hh')
 */
export const filter = register('filter', (test, pat) => pat.withHaps((haps) => haps.filter(test)));

/**
 * Filters haps by their begin time
 * @name filterWhen
 * @noAutocomplete
 * @param {Function} test function to test Hap.whole.begin
 */
export const filterWhen = register('filterWhen', (test, pat) => pat.filter((h) => test(h.whole.begin)));

/**
 * Use within to apply a function to only a part of a pattern.
 * @name within
 * @param {number} start start within cycle (0 - 1)
 * @param {number} end end within cycle (0 - 1). Must be > start
 * @param {Function} func function to be applied to the sub-pattern
 */
export const within = register('within', (a, b, fn, pat) =>
  stack(
    fn(pat.filterWhen((t) => t.cyclePos() >= a && t.cyclePos() <= b)),
    pat.filterWhen((t) => t.cyclePos() < a || t.cyclePos() > b),
  ),
);

//////////////////////////////////////////////////////////////////////
// Tactus-related functions, i.e. ones that do stepwise
// transformations

Pattern.prototype.stepJoin = function () {
  const pp = this;
  const first_t = s_cat(..._retime(_slices(pp.queryArc(0, 1)))).tactus;
  const q = function (state) {
    const shifted = pp.early(state.span.begin.sam());
    const haps = shifted.query(state.setSpan(new TimeSpan(Fraction(0), Fraction(1))));
    const pat = s_cat(..._retime(_slices(haps)));
    return pat.query(state);
  };
  return new Pattern(q, first_t);
};

export function _retime(timedHaps) {
  const occupied_perc = timedHaps.filter((t, pat) => pat.hasTactus).reduce((a, b) => a.add(b), Fraction(0));
  const occupied_tactus = removeUndefineds(timedHaps.map((t, pat) => pat.tactus)).reduce(
    (a, b) => a.add(b),
    Fraction(0),
  );
  const total_tactus = occupied_perc.eq(0) ? undefined : occupied_tactus.div(occupied_perc);
  function adjust(dur, pat) {
    if (pat.tactus === undefined) {
      return [dur.mulmaybe(total_tactus), pat];
    }
    return [pat.tactus, pat];
  }
  return timedHaps.map((x) => adjust(...x));
}

export function _slices(haps) {
  // slices evs = map (\s -> ((snd s - fst s), stack $ map value $ fit s evs))
  // $ pairs $ sort $ nubOrd $ 0:1:concatMap (\ev -> start (part ev):stop (part ev):[]) evs
  const breakpoints = flatten(haps.map((hap) => [hap.part.begin, hap.part.end]));
  const unique = uniqsortr([Fraction(0), Fraction(1), ...breakpoints]);
  const slicespans = pairs(unique);
  return slicespans.map((s) => [
    s[1].sub(s[0]),
    stack(..._fitslice(new TimeSpan(...s), haps).map((x) => x.value.withHap((h) => h.setContext(h.combineContext(x))))),
  ]);
}

export function _fitslice(span, haps) {
  return removeUndefineds(haps.map((hap) => _match(span, hap)));
}

export function _match(span, hap_p) {
  const subspan = span.intersection(hap_p.part);
  if (subspan == undefined) {
    return undefined;
  }
  return new Hap(hap_p.whole, subspan, hap_p.value, hap_p.context);
}

/**
 * *EXPERIMENTAL* - Speeds a pattern up or down, to fit to the given number of steps per cycle (aka tactus).
 * @example
 * s("bd sd cp").steps(4)
 * // The same as s("{bd sd cp}%4")
 */
export const steps = register('steps', function (targetTactus, pat) {
  if (pat.tactus === undefined) {
    return pat;
  }
  if (pat.tactus.eq(Fraction(0))) {
    // avoid divide by zero..
    return nothing;
  }
  return pat.fast(Fraction(targetTactus).div(pat.tactus));
});

export function _polymeterListSteps(steps, ...args) {
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

/**
 * Aligns one or more given patterns to the given number of steps per cycle.
 * This relies on patterns having coherent number of steps per cycle,
 *
 * @name s_polymeterSteps
 * @param  {number} steps how many items are placed in one cycle
 * @param  {any[]} patterns one or more patterns
 * @example
 * // the same as "{c d, e f g}%4"
 * s_polymeterSteps(4, "c d", "e f g").note()
 */
export function s_polymeterSteps(steps, ...args) {
  if (args.length == 0) {
    return silence;
  }
  if (Array.isArray(args[0])) {
    // Support old behaviour
    return _polymeterListSteps(steps, ...args);
  }

  return s_polymeter(...args).steps(steps);
}

/**
 * *EXPERIMENTAL* - Combines the given lists of patterns with the same pulse, creating polymeters when different sized sequences are used.
 * @synonyms pm
 * @example
 * // The same as note("{c eb g, c2 g2}")
 * s_polymeter("c eb g", "c2 g2").note()
 *
 */
export function s_polymeter(...args) {
  if (Array.isArray(args[0])) {
    // Support old behaviour
    return _polymeterListSteps(0, ...args);
  }

  // TODO currently ignoring arguments without tactus...
  args = args.filter((arg) => arg.hasTactus);

  if (args.length == 0) {
    return silence;
  }
  const tactus = args[0].tactus;
  if (tactus.eq(Fraction(0))) {
    return nothing;
  }
  const [head, ...tail] = args;

  const result = stack(head, ...tail.map((pat) => pat._slow(pat.tactus.div(tactus))));
  result.tactus = tactus;
  return result;
}

/** Sequences patterns like `seq`, but each pattern has a length, relative to the whole.
 * This length can either be provided as a [length, pattern] pair, or inferred from
 * the pattern's 'tactus', generally inferred by the mininotation. Has the alias `timecat`.
 * @name s_cat
 * @synonyms timeCat, timecat
 * @return {Pattern}
 * @example
 * s_cat([3,"e3"],[1, "g3"]).note()
 * // the same as "e3@3 g3".note()
 * @example
 * s_cat("bd sd cp","hh hh").sound()
 * // the same as "bd sd cp hh hh".sound()
 */
export function s_cat(...timepats) {
  if (timepats.length === 0) {
    return nothing;
  }
  const findtactus = (x) => (Array.isArray(x) ? x : [x.tactus, x]);
  timepats = timepats.map(findtactus);
  if (timepats.find((x) => x[0] === undefined)) {
    const times = timepats.map((a) => a[0]).filter((x) => x !== undefined);
    if (times.length === 0) {
      return fastcat(...timepats.map((x) => x[1]));
    }
    if (times.length === timepats.length) {
      return nothing;
    }
    const avg = times.reduce((a, b) => a.add(b), Fraction(0)).div(times.length);
    for (let timepat of timepats) {
      if (timepat[0] === undefined) {
        timepat[0] = avg;
      }
    }
  }
  if (timepats.length == 1) {
    const result = reify(timepats[0][1]);
    return result.withTactus((_) => timepats[0][0]);
  }

  const total = timepats.map((a) => a[0]).reduce((a, b) => a.add(b), Fraction(0));
  let begin = Fraction(0);
  const pats = [];
  for (const [time, pat] of timepats) {
    if (Fraction(time).eq(0)) {
      continue;
    }
    const end = begin.add(time);
    pats.push(reify(pat)._compress(begin.div(total), end.div(total)));
    begin = end;
  }
  const result = stack(...pats);
  result.tactus = total;
  return result;
}

/** Aliases for `s_cat` */
export const timecat = s_cat;
export const timeCat = s_cat;

/**
 * *EXPERIMENTAL* - Concatenates patterns stepwise, according to their 'tactus'.
 * Similar to `s_cat`, but if an argument is a list, the whole pattern will alternate between the elements in the list.
 *
 * @return {Pattern}
 * @example
 * s_alt(["bd cp", "mt"], "bd").sound()
 */
export function s_alt(...groups) {
  groups = groups.map((a) => (Array.isArray(a) ? a.map(reify) : [reify(a)]));

  const cycles = lcm(...groups.map((x) => Fraction(x.length)));

  let result = [];
  for (let cycle = 0; cycle < cycles; ++cycle) {
    result.push(...groups.map((x) => (x.length == 0 ? silence : x[cycle % x.length])));
  }
  result = result.filter((x) => x.hasTactus && x.tactus > 0);
  const tactus = result.reduce((a, b) => a.add(b.tactus), Fraction(0));
  result = s_cat(...result);
  result.tactus = tactus;
  return result;
}

/**
 * *EXPERIMENTAL* - Retains the given number of steps in a pattern (and dropping the rest), according to its 'tactus'.
 */
export const s_add = stepRegister('s_add', function (i, pat) {
  if (!pat.hasTactus) {
    return nothing;
  }
  if (pat.tactus.lte(0)) {
    return nothing;
  }
  i = Fraction(i);
  if (i.eq(0)) {
    return nothing;
  }
  const flip = i < 0;
  if (flip) {
    i = i.abs();
  }
  const frac = i.div(pat.tactus);
  if (frac.lte(0)) {
    return nothing;
  }
  if (frac.gte(1)) {
    return pat;
  }
  if (flip) {
    return pat.zoom(Fraction(1).sub(frac), 1);
  }
  return pat.zoom(0, frac);
});

/**
 * *EXPERIMENTAL* - Removes the given number of steps from a pattern, according to its 'tactus'.
 */
export const s_sub = stepRegister('s_sub', function (i, pat) {
  if (!pat.hasTactus) {
    return nothing;
  }

  i = Fraction(i);
  if (i.lt(0)) {
    return pat.s_add(Fraction(0).sub(pat.tactus.add(i)));
  }
  return pat.s_add(pat.tactus.sub(i));
});

export const s_cycles = stepRegister('s_extend', function (factor, pat) {
  return pat.fast(factor).s_expand(factor);
});

export const s_expand = stepRegister('s_expand', function (factor, pat) {
  return pat.withTactus((t) => t.mul(Fraction(factor)));
});

export const s_contract = stepRegister('s_contract', function (factor, pat) {
  return pat.withTactus((t) => t.div(Fraction(factor)));
});

/**
 * *EXPERIMENTAL*
 */
Pattern.prototype.s_taperlist = function (amount, times) {
  const pat = this;

  if (!pat.hasTactus) {
    return [pat];
  }

  times = times - 1;

  if (times === 0) {
    return [pat];
  }

  const list = [];
  const reverse = amount > 0;
  amount = Fraction(Math.abs(amount));
  const start = pat.tactus.sub(amount.mul(Fraction(times))).max(Fraction(0));

  for (let i = 0; i < times; ++i) {
    list.push(pat.zoom(0, start.add(amount.mul(Fraction(i))).div(pat.tactus)));
  }
  list.push(pat);
  if (reverse) {
    list.reverse();
  }
  return list;
};
export const s_taperlist = (amount, times, pat) => pat.s_taperlist(amount, times);

/**
 * *EXPERIMENTAL*
 */
export const s_taper = register(
  's_taper',
  function (amount, times, pat) {
    if (!pat.hasTactus) {
      return nothing;
    }

    const list = pat.s_taperlist(amount, times);
    const result = s_cat(...list);
    result.tactus = list.reduce((a, b) => a.add(b.tactus), Fraction(0));
    return result;
  },
  true,
  false,
  (x) => x.stepJoin(),
);

/**
 * *EXPERIMENTAL*
 */
Pattern.prototype.s_tour = function (...many) {
  return s_cat(
    ...[].concat(
      ...many.map((x, i) => [...many.slice(0, many.length - i), this, ...many.slice(many.length - i)]),
      this,
      ...many,
    ),
  );
};

export const s_tour = function (pat, ...many) {
  return pat.s_tour(...many);
};

//////////////////////////////////////////////////////////////////////
// Control-related functions, i.e. ones that manipulate patterns of
// objects

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
 *  .loopAt(2) // fit sample into 2 cycles
 *
 */
export const chop = register('chop', function (n, pat) {
  const slices = Array.from({ length: n }, (x, i) => i);
  const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
  const merge = function (a, b) {
    if ('begin' in a && 'end' in a && a.begin !== undefined && a.end !== undefined) {
      const d = a.end - a.begin;
      b = { begin: a.begin + b.begin * d, end: a.begin + b.end * d };
    }
    // return a;
    return Object.assign({}, a, b);
  };
  const func = function (o) {
    return sequence(slice_objects.map((slice_o) => merge(o, slice_o)));
  };
  return pat.squeezeBind(func).setTactus(__tactus ? Fraction(n).mulmaybe(pat.tactus) : undefined);
});

/**
 * Cuts each sample into the given number of parts, triggering progressive portions of each sample at each loop.
 * @name striate
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("numbers:0 numbers:1 numbers:2").striate(6).slow(3)
 */
export const striate = register('striate', function (n, pat) {
  const slices = Array.from({ length: n }, (x, i) => i);
  const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
  const slicePat = slowcat(...slice_objects);
  return pat
    .set(slicePat)
    ._fast(n)
    .setTactus(__tactus ? Fraction(n).mulmaybe(pat.tactus) : undefined);
});

/**
 * Makes the sample fit the given number of cycles by changing the speed.
 * @name loopAt
 * @memberof Pattern
 * @returns Pattern
 * @example
 * samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
 * s("rhodes").loopAt(2)
 */
// TODO - global cps clock
const _loopAt = function (factor, pat, cps = 0.5) {
  return pat
    .speed((1 / factor) * cps)
    .unit('c')
    .slow(factor);
};

/**
 * Chops samples into the given number of slices, triggering those slices with a given pattern of slice numbers.
 * Instead of a number, it also accepts a list of numbers from 0 to 1 to slice at specific points.
 * @name slice
 * @memberof Pattern
 * @returns Pattern
 * @example
 * samples('github:tidalcycles/dirt-samples')
 * s("breaks165").slice(8, "0 1 <2 2*2> 3 [4 0] 5 6 7".every(3, rev)).slow(0.75)
 * @example
 * samples('github:tidalcycles/dirt-samples')
 * s("breaks125").fit().slice([0,.25,.5,.75], "0 1 1 <2 3>")
 */

export const slice = register(
  'slice',
  function (npat, ipat, opat) {
    return npat
      .innerBind((n) =>
        ipat.outerBind((i) =>
          opat.outerBind((o) => {
            // If it's not an object, assume it's a string and make it a 's' control parameter
            o = o instanceof Object ? o : { s: o };
            const begin = Array.isArray(n) ? n[i] : i / n;
            const end = Array.isArray(n) ? n[i + 1] : (i + 1) / n;
            return pure({ begin, end, _slices: n, ...o });
          }),
        ),
      )
      .setTactus(ipat.tactus);
  },
  false, // turns off auto-patternification
);

/**
 * Works the same as slice, but changes the playback speed of each slice to match the duration of its step.
 * @name splice
 * @example
 * samples('github:tidalcycles/dirt-samples')
 * s("breaks165")
 * .splice(8,  "0 1 [2 3 0]@2 3 0@2 7")
 */

export const splice = register(
  'splice',
  function (npat, ipat, opat) {
    const sliced = slice(npat, ipat, opat);
    return new Pattern((state) => {
      // TODO - default cps to 0.5
      const cps = state.controls._cps || 1;
      const haps = sliced.query(state);
      return haps.map((hap) =>
        hap.withValue((v) => ({
          ...{
            speed: (cps / v._slices / hap.whole.duration) * (v.speed || 1),
            unit: 'c',
          },
          ...v,
        })),
      );
    }).setTactus(ipat.tactus);
  },
  false, // turns off auto-patternification
);

export const { loopAt, loopat } = register(['loopAt', 'loopat'], function (factor, pat) {
  const tactus = pat.tactus ? pat.tactus.div(factor) : undefined;
  return new Pattern((state) => _loopAt(factor, pat, state.controls._cps).query(state), tactus);
});

/**
 * Makes the sample fit its event duration. Good for rhythmical loops like drum breaks.
 * Similar to `loopAt`.
 * @name fit
 * @example
 * samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
 * s("rhodes/2").fit()
 */
export const fit = register('fit', (pat) =>
  pat.withHaps((haps, state) =>
    haps.map((hap) =>
      hap.withValue((v) => {
        const slicedur = ('end' in v ? v.end : 1) - ('begin' in v ? v.begin : 0);
        return {
          ...v,
          speed: ((state.controls._cps || 1) / hap.whole.duration) * slicedur,
          unit: 'c',
        };
      }),
    ),
  ),
);

/**
 * Makes the sample fit the given number of cycles and cps value, by
 * changing the speed. Please note that at some point cps will be
 * given by a global clock and this function will be
 * deprecated/removed.
 * @name loopAtCps
 * @memberof Pattern
 * @returns Pattern
 * @example
 * samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
 * s("rhodes").loopAtCps(4,1.5).cps(1.5)
 */
// TODO - global cps clock
export const { loopAtCps, loopatcps } = register(['loopAtCps', 'loopatcps'], function (factor, cps, pat) {
  return _loopAt(factor, pat, cps);
});

/** exposes a custom value at query time. basically allows mutating state without evaluation */
export const ref = (accessor) =>
  pure(1)
    .withValue(() => reify(accessor()))
    .innerJoin();

let fadeGain = (p) => (p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5);

/**
 * Cross-fades between left and right from 0 to 1:
 * - 0 = (full left, no right)
 * - .5 = (both equal)
 * - 1 = (no left, full right)
 *
 * @name xfade
 * @example
 * xfade(s("bd*2"), "<0 .25 .5 .75 1>", s("hh*8"))
 */
export let xfade = (a, pos, b) => {
  pos = reify(pos);
  a = reify(a);
  b = reify(b);
  let gaina = pos.fmap((v) => ({ gain: fadeGain(v) }));
  let gainb = pos.fmap((v) => ({ gain: fadeGain(1 - v) }));
  return stack(a.mul(gaina), b.mul(gainb));
};

// the prototype version is actually flipped so left/right makes sense
Pattern.prototype.xfade = function (pos, b) {
  return xfade(this, pos, b);
};
