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

import { compose, removeUndefineds, flatten, id, listRange, curry, _mod, numeralArgs, parseNumeral } from './util.mjs';
import drawLine from './drawLine.mjs';
import { logger } from './logger.mjs';

let stringParser;

// parser is expected to turn a string into a pattern
// if set, the reify function will parse all strings with it
// intended to use with mini to automatically interpret all strings as mini notation
export const setStringParser = (parser) => (stringParser = parser);

/** @class Class representing a pattern. */
export class Pattern {
  /**
   * Create a pattern. As an end user, you will most likely not create a Pattern directly.
   *
   * @param {function} query - The function that maps a {@link State} to an array of {@link Hap}.
   * @noAutocomplete
   */
  constructor(query) {
    this.query = query;
    this._Pattern = true; // this property is used to detect if a pattern that fails instanceof Pattern is an instance of another Pattern
  }

  //////////////////////////////////////////////////////////////////////
  // Haskell-style functor, applicative and monadic operations

  /**
   * Returns a new pattern, with the function applied to the value of
   * each hap. It has the alias {@link Pattern#fmap}.
   * @synonyms fmap
   * @param {Function} func to to apply to the value
   * @returns Pattern
   * @example
   * "0 1 2".withValue(v => v + 10).log()
   */
  withValue(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withValue(func)));
  }

  /**
   * see {@link Pattern#withValue}
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
    return new Pattern(query);
  }

  /**
   * As with {@link Pattern#appLeft}, but `whole` timespans are instead taken from the
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
   * @noAutocomplete
   */
  queryArc(begin, end) {
    try {
      return this.query(new State(new TimeSpan(begin, end)));
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
   * As with {@link Pattern#withQuerySpan}, but the function is applied to both the
   * begin and end time of the query timespan.
   * @param {Function} func the function to apply
   * @returns Pattern
   * @noAutocomplete
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
   * @noAutocomplete
   */
  withHapSpan(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withSpan(func)));
  }

  /**
   * As with {@link Pattern#withHapSpan}, but the function is applied to both the
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
    return new Pattern((state) => func(this.query(state)));
  }

  /**
   * As with {@link Pattern#withHaps}, but applies the function to every hap, rather than every list of haps.
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
    return this.withHap((hap) => hap.setContext(func(hap.context)));
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
    return this.withContext((context) => {
      const locations = (context.locations || []).concat([location]);
      return { ...context, locations };
    });
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
   * As with {@link Pattern#filterHaps}, but the function is applied to values
   * inside haps.
   * @param {Function} value_test
   * @returns Pattern
   * @noAutocomplete
   */
  filterValues(value_test) {
    return new Pattern((state) => this.query(state).filter((hap) => value_test(hap.value)));
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
   * More human-readable version of the {@link Pattern#firstCycleValues} accessor.
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
  // Methods without corresponding toplevel functions

  /**
   * Layers the result of the given function(s). Like {@link Pattern.superimpose}, but without the original pattern:
   * @name layer
   * @memberof Pattern
   * @synonyms apply
   * @returns Pattern
   * @example
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*4"
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
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*4"
   *   .superimpose(x=>x.add(2))
   *   .scale('C minor').note()
   */
  superimpose(...funcs) {
    return this.stack(...funcs.map((func) => func(this)));
  }

  //////////////////////////////////////////////////////////////////////
  // Multi-pattern functions

  /**
   * Stacks the given pattern(s) to the current pattern.
   * @name stack
   * @memberof Pattern
   * @example
   * s("hh*2").stack(
   *   note("c2(3,8)")
   * )
   */
  stack(...pats) {
    return stack(this, ...pats);
  }

  sequence(...pats) {
    return sequence(this, ...pats);
  }

  /**
   * Appends the given pattern(s) to the current pattern.
   * @name seq
   * @memberof Pattern
   * @synonyms sequence, fastcat
   * @example
   * s("hh*2").seq(
   *   note("c2(3,8)")
   * )
   */
  seq(...pats) {
    return sequence(this, ...pats);
  }

  /**
   * Appends the given pattern(s) to the next cycle.
   * @name cat
   * @memberof Pattern
   * @synonyms slowcat
   * @example
   * s("hh*2").cat(
   *   note("c2(3,8)")
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

  //////////////////////////////////////////////////////////////////////
  // Context methods - ones that deal with metadata

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
 * .arp("0 [0,2] 1 [0,2]").slow(2)
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

  const hows = ['In', 'Out', 'Mix', 'Squeeze', 'SqueezeOut', 'Trig', 'Trigzero'];

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
   * note("c3,eb3,g3")
   *   .struct("x ~ x ~ ~ x ~ x ~ ~ ~ x ~ x ~ ~")
   *   .slow(4)
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
   * note("c [eb,g] d [eb,g]").mask("<1 [0 1]>").slow(2)
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
   * s("<bd lt> sd, hh*4").reset("<x@3 x(3,8)>")
   */
  Pattern.prototype.reset = function (...args) {
    return this.keepif.trig(...args);
  };
  Pattern.prototype.resetAll = function (...args) {
    return this.keep.trig(...args);
  };
  /**
   * Restarts the pattern for each onset of the restart pattern.
   * While reset will only reset the current cycle, restart will start from cycle 0.
   *
   * @example
   * s("<bd lt> sd, hh*4").restart("<x@3 x(3,8)>")
   */
  Pattern.prototype.restart = function (...args) {
    return this.keepif.trigzero(...args);
  };
  Pattern.prototype.restartAll = function (...args) {
    return this.keep.trigzero(...args);
  };
})();

// aliases
export const polyrhythm = stack;
export const pr = stack;

export const pm = polymeter;

// methods that create patterns, which are added to patternified Pattern methods
// TODO: remove? this is only used in old transpiler (shapeshifter)
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

/**
 * Does absolutely nothing..
 * @name silence
 * @example
 * silence // "~"
 */
export const silence = new Pattern(() => []);

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
 * @synonyms polyrhythm, pr
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

/** The given items are con**cat**enated, where each one takes one cycle.
 *
 * @param {...any} items - The items to concatenate
 * @synonyms slowcat
 * @return {Pattern}
 * @example
 * cat(e5, b4, [d5, c5]).note() // "<e5 b4 [d5 c5]>".note()
 *
 */
export function cat(...pats) {
  return slowcat(...pats);
}

/** Like {@link Pattern.seq}, but each step has a length, relative to the whole.
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

/**
 * Allows to arrange multiple patterns together over multiple cycles.
 * Takes a variable number of arrays with two elements specifying the number of cycles and the pattern to use.
 *
 * @return {Pattern}
 * @example
 * arrange([4, "<c a f e>(3,8)"],[2, "<g a>(5,8)"]).note()
 */
export function arrange(...sections) {
  const total = sections.reduce((sum, [cycles]) => sum + cycles, 0);
  sections = sections.map(([cycles, section]) => [cycles, section.fast(cycles)]);
  return timeCat(...sections).slow(total);
}

export function fastcat(...pats) {
  return slowcat(...pats)._fast(pats.length);
}

/** See {@link fastcat} */
export function sequence(...pats) {
  return fastcat(...pats);
}

/** Like **cat**, but the items are crammed into one cycle.
 * @synonyms fastcat, sequence
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
/**
 * Aligns one or more given sequences to the given number of steps per cycle.
 *
 * @name polymeterSteps
 * @param  {number} steps how many items are placed in one cycle
 * @param  {any[]} sequences one or more arrays of Patterns / values
 * @example
 * polymeterSteps(2, ["c", "d", "e", "f", "g", "f", "e", "d"])
 * .note().stack(s("bd")) // 1 cycle = 1 bd = 2 notes
 * // note("{c d e f g f e d}%2").stack(s("bd"))
 */
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

/**
 * Combines the given lists of patterns with the same pulse. This will create so called polymeters when different sized sequences are used.
 * @synonyms pm
 * @example
 * polymeter(["c", "eb", "g"], ["c2", "g2"]).note()
 * // "{c eb g, c2 g2}".note()
 *
 */
export function polymeter(...args) {
  return polymeterSteps(0, ...args);
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
export function register(name, func, patternify = true) {
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
      if (arity === 1) {
        return func(pat);
      }
      const [left, ...right] = args.slice(0, -1);
      let mapFn = (...args) => {
        // make sure to call func with the correct argument count
        // args.length is expected to be <= arity-1
        // so we set undefined args explicitly undefined
        Array(arity - 1)
          .fill()
          .map((_, i) => args[i] ?? undefined);
        return func(...args, pat);
      };
      mapFn = curry(mapFn, null, arity - 1);
      return right.reduce((acc, p) => acc.appLeft(p), left.fmap(mapFn)).innerJoin();
    };
  } else {
    pfunc = function (...args) {
      args = args.map(reify);
      return func(...args);
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
      return func(...args, this);
    };
  }

  // toplevel functions get curried as well as patternified
  // because pfunc uses spread args, we need to state the arity explicitly!
  return curry(pfunc, null, arity);
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
 * "0.5 1.5 2.5".round().scale('C major').note()
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
 * "42 42.1 42.5 43".floor().note()
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
 * "42 42.1 42.5 43".ceil().note()
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
 * s("bd sd,hh*4").cutoff(sine.range(500,2000).slow(4))
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
 * s("bd sd,hh*4").cutoff(sine.rangex(500,2000).slow(4))
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
 * s("bd sd,hh*4").cutoff(sine2.range2(500,2000).slow(4))
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
 * ratio("1, 5:4, 3:2").mul(110).freq().s("piano").slow(2)
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
 * Similar to compress, but doesn't leave gaps, and the 'focus' can be bigger than a cycle
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
  return pat.fmap((x) => pure(x)._fast(factor)).squeezeJoin();
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
 * s("<bd sd> hh").fast(2) // s("[<bd sd> hh]*2")
 */
export const { fast, density } = register(['fast', 'density'], function (factor, pat) {
  if (factor === 0) {
    return silence;
  }
  factor = Fraction(factor);
  const fastQuery = pat.withQueryTime((t) => t.mul(factor));
  return fastQuery.withHapTime((t) => t.div(factor));
});

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
 * s("<bd sd> hh").slow(2) // s("[<bd sd> hh]/2")
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
 * An alias for {@link firstOf}
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
// TODO - global clock
export const cpm = register('cpm', function (cpm, pat) {
  return pat._fast(cpm / 60);
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
export const early = register('early', function (offset, pat) {
  offset = Fraction(offset);
  return pat.withQueryTime((t) => t.add(offset)).withHapTime((t) => t.sub(offset));
});

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
export const late = register('late', function (offset, pat) {
  offset = Fraction(offset);
  return pat._early(Fraction(0).sub(offset));
});

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
  const d = e.sub(s);
  return pat
    .withQuerySpan((span) => span.withCycle((t) => t.mul(d).add(s)))
    .withHapSpan((span) => span.withCycle((t) => t.sub(s).div(d)))
    .splitQueries();
});

export const { zoomArc, zoomarc } = register(['zoomArc', 'zoomarc'], function (a, pat) {
  return pat.zoom(a.begin, a.end);
});

/**
 * Selects the given fraction of the pattern and repeats that part to fill the remainder of the cycle.
 * @param {number} fraction fraction to select
 * @example
 * s("lt ht mt cp, [hh oh]*2").linger("<1 .5 .25 .125>")
 */
export const linger = register('linger', function (t, pat) {
  if (t == 0) {
    return silence;
  } else if (t < 0) {
    return pat._zoom(t.add(1), 1)._slow(t);
  }
  return pat._zoom(0, t)._slow(t);
});

/**
 * Samples the pattern at a rate of n events per cycle. Useful for turning a continuous pattern into a discrete one.
 * @param {number} segments number of segments per cycle
 * @example
 * note(saw.range(0,12).segment(24)).add(40)
 */
export const segment = register('segment', function (rate, pat) {
  return pat.struct(pure(true)._fast(rate));
});

/**
 * Swaps 1s and 0s in a binary pattern.
 * @name invert
 * @synonyms inv
 * @example
 * s("bd").struct("1 0 0 1 0 0 1 0".lastOf(4, invert))
 */
export const { invert, inv } = register(['invert', 'inv'], function (pat) {
  // Swap true/false in a binary pattern
  return pat.fmap((x) => !x);
});

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
 * note("c3 d3 e3 g3").rev()
 */
export const rev = register('rev', function (pat) {
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
});

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
export const hush = register('hush', function (pat) {
  return silence;
});

/**
 * Applies `rev` to a pattern every other cycle, so that the pattern alternates between forwards and backwards.
 * @example
 * note("c d e g").palindrome()
 */
export const palindrome = register('palindrome', function (pat) {
  return pat.every(2, rev);
});

/**
 * Jux with adjustable stereo width. 0 = mono, 1 = full stereo.
 * @name juxBy
 * @synonyms juxby
 * @example
 * s("lt ht mt ht hh").juxBy("<0 .5 1>/2", rev)
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
  const right = pat.withValue((val) => Object.assign({}, val, { pan: elem_or(val, 'pan', 0.5) + by }));

  return stack(left, func(right));
});

/**
 * The jux function creates strange stereo effects, by applying a function to a pattern, but only in the right-hand channel.
 * @example
 * s("lt ht mt ht hh").jux(rev)
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
 * .scale('C minor').note().clip(.2)
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
  return pat._echoWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
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
  return pat._echoWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
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

export const iter = register('iter', function (times, pat) {
  return _iter(times, pat, false);
});

/**
 * Like `iter`, but plays the subdivisions in reverse order. Known as iter' in tidalcycles
 * @name iterBack
 * @synonyms iterback
 * @memberof Pattern
 * @returns Pattern
 * @example
 * note("0 1 2 3".scale('A minor')).iterBack(4)
 */
export const { iterBack, iterback } = register(['iterBack', 'iterback'], function (times, pat) {
  return _iter(times, pat, true);
});

/**
 * Divides a pattern into a given number of parts, then cycles through those parts in turn, applying the given function to each part in turn (one part per cycle).
 * @name chunk
 * @memberof Pattern
 * @returns Pattern
 * @example
 * "0 1 2 3".chunk(4, x=>x.add(7)).scale('A minor').note()
 */
const _chunk = function (n, func, pat, back = false) {
  const binary = Array(n - 1).fill(false);
  binary.unshift(true);
  const binary_pat = _iter(n, sequence(...binary), back);
  return pat.when(binary_pat, func);
};

export const chunk = register('chunk', function (n, func, pat) {
  return _chunk(n, func, pat, false);
});

/**
 * Like `chunk`, but cycles through the parts in reverse order. Known as chunk' in tidalcycles
 * @name chunkBack
 * @synonyms chunkback
 * @memberof Pattern
 * @returns Pattern
 * @example
 * "0 1 2 3".chunkBack(4, x=>x.add(7)).scale('A minor').note()
 */
export const { chunkBack, chunkback } = register(['chunkBack', 'chunkback'], function (n, func, pat) {
  return _chunk(n, func, pat, true);
});

// TODO - redefine elsewhere in terms of mask
export const bypass = register('bypass', function (on, pat) {
  on = Boolean(parseInt(on));
  return on ? silence : pat;
});

/**
 * Loops the pattern inside at `offset` for `cycles`.
 * @param {number} offset start point of loop in cycles
 * @param {number} cycles loop length in cycles
 * @example
 * // Looping a portion of randomness
 * note(irand(8).segment(4).scale('C3 minor')).ribbon(1337, 2)
 */
export const ribbon = register('ribbon', (offset, cycles, pat) => pat.early(offset).restart(pure(1).slow(cycles)));

// sets absolute duration of haps
// TODO - fix
export const duration = register('duration', function (value, pat) {
  return pat.withHapSpan((span) => new TimeSpan(span.begin, span.begin.add(value)));
});

/**
 * Sets the color of the hap in visualizations like pianoroll or highlighting.
 */
// TODO: move this to controls https://github.com/tidalcycles/strudel/issues/288
export const { color, colour } = register(['color', 'colour'], function (color, pat) {
  return pat.withContext((context) => ({ ...context, color }));
});

/**
 *
 * Sets the velocity from 0 to 1. Is multiplied together with gain.
 * @name velocity
 * @example
 * s("hh*8")
 * .gain(".4!2 1 .4!2 1 .4 1")
 * .velocity(".4 1")
 */
export const velocity = register('velocity', function (velocity, pat) {
  return pat.withContext((context) => ({ ...context, velocity: (context.velocity || 1) * velocity }));
});

/**
 *
 * Multiplies the hap duration with the given factor.
 * With samples, `clip` might be a better function to use ([more info](https://github.com/tidalcycles/strudel/pull/598))
 * @name legato
 * @memberof Pattern
 * @example
 * note("c3 eb3 g3 c4").legato("<.25 .5 1 2>")
 */
// TODO - fix
export const legato = register('legato', function (value, pat) {
  value = Fraction(value);
  return pat.withHapSpan((span) => new TimeSpan(span.begin, span.begin.add(span.end.sub(span.begin).mul(value))));
});

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
 *  .loopAt(4) // fit sample into 4 cycles
 *
 */
export const chop = register('chop', function (n, pat) {
  const slices = Array.from({ length: n }, (x, i) => i);
  const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
  const func = function (o) {
    return sequence(slice_objects.map((slice_o) => Object.assign({}, o, slice_o)));
  };
  return pat.squeezeBind(func);
});

export const striate = register('striate', function (n, pat) {
  const slices = Array.from({ length: n }, (x, i) => i);
  const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
  const slicePat = slowcat(...slice_objects);
  return pat.set(slicePat)._fast(n);
});

/**
 * Makes the sample fit the given number of cycles by changing the speed.
 * @name loopAt
 * @memberof Pattern
 * @returns Pattern
 * @example
 * samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
 * s("rhodes").loopAt(4)
 */
// TODO - global cps clock
const _loopAt = function (factor, pat, cps = 1) {
  return pat
    .speed((1 / factor) * cps)
    .unit('c')
    .slow(factor);
};

/*
 * Chops samples into the given number of slices, triggering those slices with a given pattern of slice numbers.
 * @name slice
 * @memberof Pattern
 * @returns Pattern
 * @example
 * await samples('github:tidalcycles/Dirt-Samples/master')
 * s("breaks165").slice(8, "0 1 <2 2*2> 3 [4 0] 5 6 7".every(3, rev)).slow(1.5)
 */

export const slice = register(
  'slice',
  function (npat, ipat, opat) {
    return npat.innerBind((n) =>
      ipat.outerBind((i) =>
        opat.outerBind((o) => {
          // If it's not an object, assume it's a string and make it a 's' control parameter
          o = o instanceof Object ? o : { s: o };
          // Remember we must stay pure and avoid editing the object directly
          const toAdd = { begin: i / n, end: (i + 1) / n, _slices: n };
          return pure({ ...toAdd, ...o });
        }),
      ),
    );
  },
  false, // turns off auto-patternification
);

/*
 * Works the same as slice, but changes the playback speed of each slice to match the duration of its step.
 * @name splice
 * @memberof Pattern
 * @returns Pattern
 * @example
 * await samples('github:tidalcycles/Dirt-Samples/master')
 * s("breaks165").splice(8,  "0 1 [2 3 0]@2 3 0@2 7").hurry(0.65)
 */

export const splice = register(
  'splice',
  function (npat, ipat, opat) {
    const sliced = slice(npat, ipat, opat);
    return sliced.withHap(function (hap) {
      return hap.withValue((v) => ({
        ...{
          speed: (1 / v._slices / hap.whole.duration) * (v.speed || 1),
          unit: 'c',
        },
        ...v,
      }));
    });
  },
  false, // turns off auto-patternification
);

// this function will be redefined in repl.mjs to use the correct cps value.
// It is still here to work in cases where repl.mjs is not used

export const { loopAt, loopat } = register(['loopAt', 'loopat'], function (factor, pat) {
  return _loopAt(factor, pat, 1);
});

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
