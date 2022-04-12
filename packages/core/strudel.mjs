import Fraction from './fraction.mjs';
import { isNote, toMidi, compose } from './util.mjs';

// Removes 'None' values from given list
const removeUndefineds = (xs) => xs.filter((x) => x != undefined);

const flatten = (arr) => [].concat(...arr);

const id = (a) => a;

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => i + min);

export function curry(func, overload) {
  const fn = function curried(...args) {
    if (args.length >= func.length) {
      return func.apply(this, args);
    } else {
      const partial = function (...args2) {
        return curried.apply(this, args.concat(args2));
      };
      if (overload) {
        overload(partial, args);
      }
      return partial;
    }
  };
  if (overload) {
    // overload function without args... needed for chordBass.transpose(2)
    overload(fn, []);
  }
  return fn;
}

class TimeSpan {
  constructor(begin, end) {
    this.begin = Fraction(begin);
    this.end = Fraction(end);
  }

  get spanCycles() {
    const spans = [];
    var begin = this.begin;
    const end = this.end;
    const end_sam = end.sam();

    while (end.gt(begin)) {
      // If begin and end are in the same cycle, we're done.
      if (begin.sam().equals(end_sam)) {
        spans.push(new TimeSpan(begin, this.end));
        break;
      }
      // add a timespan up to the next sam
      const next_begin = begin.nextSam();
      spans.push(new TimeSpan(begin, next_begin));

      // continue with the next cycle
      begin = next_begin;
    }
    return spans;
  }

  cycleArc() {
    // Shifts a timespan to one of equal duration that starts within cycle zero.
    // (Note that the output timespan probably does not start *at* Time 0 --
    // that only happens when the input Arc starts at an integral Time.)
    const b = this.begin.cyclePos();
    const e = b + (this.end - this.begin);
    return new TimeSpan(b, e);
  }

  withTime(func_time) {
    // Applies given function to both the begin and end time value of the timespan"""
    return new TimeSpan(func_time(this.begin), func_time(this.end));
  }
  withEnd(func_time) {
    // Applies given function to both the begin and end time value of the timespan"""
    return new TimeSpan(this.begin, func_time(this.end));
  }

  intersection(other) {
    // Intersection of two timespans, returns None if they don't intersect.
    const intersect_begin = this.begin.max(other.begin);
    const intersect_end = this.end.min(other.end);

    if (intersect_begin.gt(intersect_end)) {
      return undefined;
    }
    if (intersect_begin.equals(intersect_end)) {
      // Zero-width (point) intersection - doesn't intersect if it's at the end of a
      // non-zero-width timespan.
      if (intersect_begin.equals(this.end) && this.begin.lt(this.end)) {
        return undefined;
      }
      if (intersect_begin.equals(other.end) && other.begin.lt(other.end)) {
        return undefined;
      }
    }
    return new TimeSpan(intersect_begin, intersect_end);
  }

  intersection_e(other) {
    // Like 'sect', but raises an exception if the timespans don't intersect.
    const result = this.intersection(other);
    if (result == undefined) {
      // TODO - raise exception
      // raise ValueError(f'TimeSpan {self} and TimeSpan {other} do not intersect')
    }
    return result;
  }

  midpoint() {
    return this.begin.add(this.end.sub(this.begin).div(Fraction(2)));
  }

  equals(other) {
    return this.begin.equals(other.begin) && this.end.equals(other.end);
  }

  show() {
    return this.begin.show() + ' -> ' + this.end.show();
  }
}

class Hap {
  /*
    Event class, representing a value active during the timespan
    'part'. This might be a fragment of an event, in which case the
    timespan will be smaller than the 'whole' timespan, otherwise the
    two timespans will be the same. The 'part' must never extend outside of the
    'whole'. If the event represents a continuously changing value
    then the whole will be returned as None, in which case the given
    value will have been sampled from the point halfway between the
    start and end of the 'part' timespan.
    The context is to store a list of source code locations causing the event
    */

  constructor(whole, part, value, context = {}, stateful = false) {
    this.whole = whole;
    this.part = part;
    this.value = value;
    this.context = context;
    this.stateful = stateful;
    if (stateful) {
      console.assert(typeof this.value === 'function', 'Stateful values must be functions');
    }
  }

  get duration() {
    return this.whole.end.sub(this.whole.begin).valueOf();
  }

  wholeOrPart() {
    return this.whole ? this.whole : this.part;
  }

  withSpan(func) {
    // Returns a new event with the function f applies to the event timespan.
    const whole = this.whole ? func(this.whole) : undefined;
    return new Hap(whole, func(this.part), this.value, this.context);
  }

  withValue(func) {
    // Returns a new event with the function f applies to the event value.
    return new Hap(this.whole, this.part, func(this.value), this.context);
  }

  hasOnset() {
    // Test whether the event contains the onset, i.e that
    // the beginning of the part is the same as that of the whole timespan."""
    return this.whole != undefined && this.whole.begin.equals(this.part.begin);
  }

  resolveState(state) {
    if (this.stateful && this.hasOnset()) {
      console.log('stateful');
      const func = this.value;
      const [newState, newValue] = func(state);
      return [newState, new Hap(this.whole, this.part, newValue, this.context, false)];
    }
    return [state, this];
  }

  spanEquals(other) {
    return (this.whole == undefined && other.whole == undefined) || this.whole.equals(other.whole);
  }

  equals(other) {
    return (
      this.spanEquals(other) &&
      this.part.equals(other.part) &&
      // TODO would == be better ??
      this.value === other.value
    );
  }

  show() {
    return (
      '(' + (this.whole == undefined ? '~' : this.whole.show()) + ', ' + this.part.show() + ', ' + this.value + ')'
    );
  }

  combineContext(b) {
    const a = this;
    return { ...a.context, ...b.context, locations: (a.context.locations || []).concat(b.context.locations || []) };
  }

  setContext(context) {
    return new Hap(this.whole, this.part, this.value, context);
  }
}

export class State {
  constructor(span, controls = {}) {
    this.span = span;
    this.controls = controls;
  }

  // Returns new State with different span
  setSpan(span) {
    return new State(span, this.controls);
  }

  withSpan(func) {
    return this.setSpan(func(this.span));
  }

  // Returns new State with different controls
  setControls(controls) {
    return new State(this.span, controls);
  }
}

class Pattern {
  // the following functions will get patternFactories as nested functions:
  constructor(query) {
    this.query = query;
  }

  _splitQueries() {
    // Splits queries at cycle boundaries. This makes some calculations
    // easier to express, as all events are then constrained to happen within
    // a cycle.
    const pat = this;
    const q = (state) => {
      return flatten(state.span.spanCycles.map((subspan) => pat.query(state.setSpan(subspan))));
    };
    return new Pattern(q);
  }

  withQuerySpan(func) {
    return new Pattern((state) => this.query(state.withSpan(func)));
  }

  withQueryTime(func) {
    // Returns a new pattern, with the function applied to both the begin
    // and end of the the query timespan
    return new Pattern((state) => this.query(state.withSpan((span) => span.withTime(func))));
  }

  withEventSpan(func) {
    // Returns a new pattern, with the function applied to each event
    // timespan.
    return new Pattern((state) => this.query(state).map((hap) => hap.withSpan(func)));
  }

  withEventTime(func) {
    // Returns a new pattern, with the function applied to both the begin
    // and end of each event timespan.
    return this.withEventSpan((span) => span.withTime(func));
  }

  _withEvents(func) {
    return new Pattern((state) => func(this.query(state)));
  }

  _withEvent(func) {
    return this._withEvents((events) => events.map(func));
  }

  _setContext(context) {
    return this._withEvent((event) => event.setContext(context));
  }

  _withContext(func) {
    return this._withEvent((event) => event.setContext(func(event.context)));
  }

  _stripContext() {
    return this._withEvent((event) => event.setContext({}));
  }

  withLocation(start, end) {
    const location = {
      start: { line: start[0], column: start[1], offset: start[2] },
      end: { line: end[0], column: end[1], offset: end[2] },
    };
    return this._withContext((context) => {
      const locations = (context.locations || []).concat([location]);
      return { ...context, locations };
    });
  }

  withMiniLocation(start, end) {
    const offset = {
      start: { line: start[0], column: start[1], offset: start[2] },
      end: { line: end[0], column: end[1], offset: end[2] },
    };
    return this._withContext((context) => {
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

  withValue(func) {
    // Returns a new pattern, with the function applied to the value of
    // each event. It has the alias 'fmap'.
    return new Pattern((state) => this.query(state).map((hap) => hap.withValue(func)));
  }

  // alias
  fmap(func) {
    return this.withValue(func);
  }

  _filterEvents(event_test) {
    return new Pattern((state) => this.query(state).filter(event_test));
  }

  _filterValues(value_test) {
    return new Pattern((state) => this.query(state).filter((hap) => value_test(hap.value)));
  }

  _removeUndefineds() {
    return this._filterValues((val) => val != undefined);
  }

  onsetsOnly() {
    // Returns a new pattern that will only return events where the start
    // of the 'whole' timespan matches the start of the 'part'
    // timespan, i.e. the events that include their 'onset'.
    return this._filterEvents((hap) => hap.hasOnset());
  }

  _appWhole(whole_func, pat_val) {
    // Assumes 'this' is a pattern of functions, and given a function to
    // resolve wholes, applies a given pattern of values to that
    // pattern of functions.
    const pat_func = this;
    const query = function (state) {
      const event_funcs = pat_func.query(state);
      const event_vals = pat_val.query(state);
      const apply = function (event_func, event_val) {
        const s = event_func.part.intersection(event_val.part);
        if (s == undefined) {
          return undefined;
        }
        return new Hap(
          whole_func(event_func.whole, event_val.whole),
          s,
          event_func.value(event_val.value),
          event_val.combineContext(event_func),
        );
      };
      return flatten(
        event_funcs.map((event_func) => removeUndefineds(event_vals.map((event_val) => apply(event_func, event_val)))),
      );
    };
    return new Pattern(query);
  }

  appBoth(pat_val) {
    // Tidal's <*>
    const whole_func = function (span_a, span_b) {
      if (span_a == undefined || span_b == undefined) {
        return undefined;
      }
      return span_a.intersection_e(span_b);
    };
    return this._appWhole(whole_func, pat_val);
  }

  appLeft(pat_val) {
    const pat_func = this;

    const query = function (state) {
      const haps = [];
      for (const hap_func of pat_func.query(state)) {
        const event_vals = pat_val.query(state.setSpan(hap_func.part));
        for (const hap_val of event_vals) {
          const new_whole = hap_func.whole;
          const new_part = hap_func.part.intersection_e(hap_val.part);
          const new_value = hap_func.value(hap_val.value);
          const new_context = hap_val.combineContext(hap_func);
          const hap = new Hap(new_whole, new_part, new_value, new_context);
          haps.push(hap);
        }
      }
      return haps;
    };
    return new Pattern(query);
  }

  appRight(pat_val) {
    const pat_func = this;

    const query = function (state) {
      const haps = [];
      for (const hap_val of pat_val.query(state)) {
        const hap_funcs = pat_func.query(state.setSpan(hap_val.part));
        for (const hap_func of hap_funcs) {
          const new_whole = hap_val.whole;
          const new_part = hap_func.part.intersection_e(hap_val.part);
          const new_value = hap_func.value(hap_val.value);
          const new_context = hap_val.combineContext(hap_func);
          const hap = new Hap(new_whole, new_part, new_value, new_context);
          haps.push(hap);
        }
      }
      return haps;
    };
    return new Pattern(query);
  }

  firstCycle(with_context = false) {
    var self = this;
    if (!with_context) {
      self = self._stripContext();
    }
    return self.query(new State(new TimeSpan(Fraction(0), Fraction(1))));
  }

  get _firstCycleValues() {
    return this.firstCycle().map((hap) => hap.value);
  }
  get _showFirstCycle() {
    return this.firstCycle().map(
      (hap) => `${hap.value}: ${hap.whole.begin.toFraction()} - ${hap.whole.end.toFraction()}`,
    );
  }

  _sortEventsByPart() {
    return this._withEvents((events) =>
      events.sort((a, b) =>
        a.part.begin
          .sub(b.part.begin)
          .or(a.part.end.sub(b.part.end))
          .or(a.whole.begin.sub(b.whole.begin).or(a.whole.end.sub(b.whole.end))),
      ),
    );
  }

  _opleft(other, func) {
    return this.fmap(func).appLeft(reify(other));
  }

  _asNumber(silent = false) {
    return this._withEvent((event) => {
      const asNumber = Number(event.value);
      if (!isNaN(asNumber)) {
        return event.withValue(() => asNumber);
      }
      const specialValue = {
        e: Math.E,
        pi: Math.PI,
      }[event.value];
      if (typeof specialValue !== 'undefined') {
        return event.withValue(() => specialValue);
      }
      if (isNote(event.value)) {
        // set context type to midi to let the player know its meant as midi number and not as frequency
        return new Hap(event.whole, event.part, toMidi(event.value), { ...event.context, type: 'midi' });
      }
      if (!silent) {
        throw new Error('cannot parse as number: "' + event.value + '"');
      }
      return event.withValue(() => undefined); // silent error
    })._removeUndefineds();
  }

  add(other) {
    return this._asNumber()._opleft(other, (a) => (b) => a + b);
  }

  sub(other) {
    return this._asNumber()._opleft(other, (a) => (b) => a - b);
  }

  mul(other) {
    return this._asNumber()._opleft(other, (a) => (b) => a * b);
  }

  div(other) {
    return this._asNumber()._opleft(other, (a) => (b) => a / b);
  }

  round() {
    return this._asNumber().fmap((v) => Math.round(v));
  }

  floor() {
    return this._asNumber().fmap((v) => Math.floor(v));
  }

  ceil() {
    return this._asNumber().fmap((v) => Math.ceil(v));
  }

  union(other) {
    return this._opleft(other, (a) => (b) => Object.assign({}, a, b));
  }

  _bindWhole(choose_whole, func) {
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
    return this._bindWhole(whole_func, func);
  }

  join() {
    // Flattens a pattern of patterns into a pattern, where wholes are
    // the intersection of matched inner and outer events.
    return this.bind(id);
  }

  outerBind(func) {
    return this._bindWhole((a, _) => a, func);
  }

  outerJoin() {
    // Flattens a pattern of patterns into a pattern, where wholes are
    // taken from inner events.
    return this.outerBind(id);
  }

  innerBind(func) {
    return this._bindWhole((_, b) => b, func);
  }

  innerJoin() {
    // Flattens a pattern of patterns into a pattern, where wholes are
    // taken from inner events.
    return this.innerBind(id);
  }

  _squeezeJoin() {
    const pat_of_pats = this;
    function query(state) {
      const haps = pat_of_pats.query(state);
      function flatHap(outerHap) {
        const pat = outerHap.value._compressSpan(outerHap.wholeOrPart().cycleArc());
        const innerHaps = pat.query(state.setSpan(outerHap.part));
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

  _squeezeBind(func) {
    return this.fmap(func)._squeezeJoin();
  }

  _apply(func) {
    return func(this);
  }

  layer(...funcs) {
    return stack(...funcs.map((func) => func(this)));
  }

  _patternify(func) {
    const pat = this;
    const patterned = function (...args) {
      // the problem here: args could a pattern that has been turned into an object to add location
      // to avoid object checking for every pattern method, we can remove it here...
      // in the future, patternified args should be marked as well + some better object handling
      args = args.map((arg) => (isPattern(arg) ? arg.fmap((value) => value.value || value) : arg));
      const pat_arg = sequence(...args);
      // arg.locations has to go somewhere..
      return pat_arg.fmap((arg) => func.call(pat, arg)).innerJoin();
    };
    return patterned;
  }

  _fastGap(factor) {
    // Maybe it's better without this fallback..
    // if (factor < 1) {
    //     // there is no gap.. so maybe revert to _fast?
    //     return this._fast(factor)
    // }
    const qf = function (span) {
      const cycle = span.begin.sam();
      const begin = cycle.add(span.begin.sub(cycle).mul(factor).min(1));
      const end = cycle.add(span.end.sub(cycle).mul(factor).min(1));
      return new TimeSpan(begin, end);
    };
    const ef = function (span) {
      const cycle = span.begin.sam();
      const begin = cycle.add(span.begin.sub(cycle).div(factor).min(1));
      const end = cycle.add(span.end.sub(cycle).div(factor).min(1));
      return new TimeSpan(begin, end);
    };
    return this.withQuerySpan(qf).withEventSpan(ef)._splitQueries();
  }

  _compressSpan(span) {
    const b = span.begin;
    const e = span.end;
    if (b > e || b > 1 || e > 1 || b < 0 || e < 0) {
      return silence;
    }
    return this._fastGap(Fraction(1).div(e.sub(b)))._late(b);
  }

  _fast(factor) {
    const fastQuery = this.withQueryTime((t) => t.mul(factor));
    return fastQuery.withEventTime((t) => t.div(factor));
  }

  _slow(factor) {
    return this._fast(Fraction(1).div(factor));
  }

  _ply(factor) {
    return this.fmap((x) => pure(x)._fast(factor))._squeezeJoin();
  }

  _chop(n) {
    const slices = Array.from({length: n}, (x, i) => i);
    const slice_objects = slices.map(i => ({begin: i/n, end: (i+1)/n}));
    const func = function(o) {
      return(sequence(slice_objects.map(slice_o => Object.assign({}, o, slice_o))))
    }
    return(this._squeezeBind(func));
  }

  // cpm = cycles per minute
  _cpm(cpm) {
    return this._fast(cpm / 60);
  }

  _early(offset) {
    // Equivalent of Tidal's <~ operator
    offset = Fraction(offset);
    return this.withQueryTime((t) => t.add(offset)).withEventTime((t) => t.sub(offset));
  }

  _late(offset) {
    // Equivalent of Tidal's ~> operator
    offset = Fraction(offset);
    return this._early(Fraction(0).sub(offset));
  }

  struct(...binary_pats) {
    // Re structure the pattern according to a binary pattern (false values are dropped)
    const binary_pat = sequence(binary_pats);
    return binary_pat
      .fmap((b) => (val) => b ? val : undefined)
      .appLeft(this)
      ._removeUndefineds();
  }

  mask(...binary_pats) {
    // Only let through parts of pattern corresponding to true values in the given binary pattern
    const binary_pat = sequence(binary_pats);
    return binary_pat
      .fmap((b) => (val) => b ? val : undefined)
      .appRight(this)
      ._removeUndefineds();
  }

  _color(color) {
    return this._withContext((context) => ({ ...context, color }));
  }

  _segment(rate) {
    return this.struct(pure(true).fast(rate));
  }

  invert() {
    // Swap true/false in a binary pattern
    return this.fmap((x) => !x);
  }

  inv() {
    // alias for invert()
    return this.invert();
  }

  when(binary_pat, func) {
    //binary_pat = sequence(binary_pat)
    const true_pat = binary_pat._filterValues(id);
    const false_pat = binary_pat._filterValues((val) => !val);
    const with_pat = true_pat.fmap((_) => (y) => y).appRight(func(this));
    const without_pat = false_pat.fmap((_) => (y) => y).appRight(this);
    return stack(with_pat, without_pat);
  }

  off(time_pat, func) {
    return stack(this, func(this.late(time_pat)));
  }

  every(n, func) {
    const pat = this;
    const pats = Array(n - 1).fill(pat);
    pats.unshift(func(pat));
    return slowcatPrime(...pats);
  }

  append(other) {
    return fastcat(...[this, other]);
  }

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
    return new Pattern(query)._splitQueries();
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

  // is there a different name for those in tidal?
  stack(...pats) {
    return stack(this, ...pats);
  }
  sequence(...pats) {
    return sequence(this, ...pats);
  }

  superimpose(...funcs) {
    return this.stack(...funcs.map((func) => func(this)));
  }

  stutWith(times, time, func) {
    return stack(...range(0, times - 1).map((i) => func(this.late(i * time), i)));
  }

  stut(times, feedback, time) {
    return this.stutWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
  }

  // these might change with: https://github.com/tidalcycles/Tidal/issues/902
  _echoWith(times, time, func) {
    return stack(...range(0, times - 1).map((i) => func(this.late(i * time), i)));
  }

  _echo(times, time, feedback) {
    return this._echoWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
  }

  iter(times, back = false) {
    return slowcat(...range(0, times - 1).map((i) => (back ? this.late(i / times) : this.early(i / times))));
  }

  // known as iter' in tidalcycles
  iterBack(times) {
    return this.iter(times, true);
  }

  _chunk(n, func, back = false) {
    const binary = Array(n - 1).fill(false);
    binary.unshift(true);
    const binary_pat = sequence(...binary).iter(n, back);
    return this.when(binary_pat, func);
  }

  _chunkBack(n, func) {
    return this._chunk(n, func, true);
  }

  edit(...funcs) {
    return stack(...funcs.map((func) => func(this)));
  }
  pipe(func) {
    return func(this);
  }

  _bypass(on) {
    on = Boolean(parseInt(on));
    return on ? silence : this;
  }

  hush() {
    return silence;
  }

  // sets absolute duration of events
  _duration(value) {
    return this.withEventSpan((span) => new TimeSpan(span.begin, span.begin.add(value)));
  }

  // sets event relative duration of events
  _legato(value) {
    return this.withEventSpan((span) => new TimeSpan(span.begin, span.begin.add(span.end.sub(span.begin).mul(value))));
  }

  _velocity(velocity) {
    return this._withContext((context) => ({ ...context, velocity: (context.velocity || 1) * velocity }));
  }
}

// methods of Pattern that get callable factories
Pattern.prototype.patternified = [
  'apply',
  'fast',
  'slow',
  'ply',
  'chop',
  'cpm',
  'early',
  'late',
  'duration',
  'legato',
  'velocity',
  'segment',
  'color',
  'jux'
];
// methods that create patterns, which are added to patternified Pattern methods
Pattern.prototype.factories = { pure, stack, slowcat, fastcat, cat, timeCat, sequence, polymeter, pm, polyrhythm, pr };
// the magic happens in Pattern constructor. Keeping this in prototype enables adding methods from the outside (e.g. see tonal.ts)

// Elemental patterns

// Nothing
const silence = new Pattern((_) => []);

function pure(value) {
  // A discrete value that repeats once per cycle
  function query(state) {
    return state.span.spanCycles.map((subspan) => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value));
  }
  return new Pattern(query);
}

function steady(value) {
  // A continuous value
  return new Pattern((span) => Hap(undefined, span, value));
}

export const signal = (func) => {
  const query = (state) => [new Hap(undefined, state.span, func(state.span.midpoint()))];
  return new Pattern(query);
};

const _toBipolar = (pat) => pat.fmap((x) => x * 2 - 1);
const _fromBipolar = (pat) => pat.fmap((x) => (x + 1) / 2);

export const sine2 = signal((t) => Math.sin(Math.PI * 2 * t));
export const sine = _fromBipolar(sine2);

export const cosine2 = sine2._early(Fraction(1).div(4));
export const cosine = sine._early(Fraction(1).div(4));

export const saw = signal((t) => t % 1);
export const saw2 = _toBipolar(saw);

export const isaw = signal((t) => 1 - (t % 1));
export const isaw2 = _toBipolar(isaw);

export const tri2 = fastcat(isaw2, saw2);
export const tri = fastcat(isaw, saw);

export const square = signal((t) => Math.floor((t * 2) % 2));
export const square2 = _toBipolar(square);

export function isPattern(thing) {
  // thing?.constructor?.name !== 'Pattern' // <- this will fail when code is mangled
  return thing instanceof Pattern;
}

function reify(thing) {
  // Turns something into a pattern, unless it's already a pattern
  if (isPattern(thing)) {
    return thing;
  }
  return pure(thing);
}
// Basic functions for combining patterns

function stack(...pats) {
  const reified = pats.map((pat) => reify(pat));
  const query = (state) => flatten(reified.map((pat) => pat.query(state)));
  return new Pattern(query);
}

function slowcat(...pats) {
  // Concatenation: combines a list of patterns, switching between them
  // successively, one per cycle.
  pats = pats.map(reify);
  const query = function (state) {
    const span = state.span;
    const pat_n = Math.floor(span.begin) % pats.length;
    const pat = pats[pat_n];
    if (!pat) {
      // pat_n can be negative, if the span is in the past..
      return [];
    }
    // A bit of maths to make sure that cycles from constituent patterns aren't skipped.
    // For example if three patterns are slowcat-ed, the fourth cycle of the result should
    // be the second (rather than fourth) cycle from the first pattern.
    const offset = span.begin.floor().sub(span.begin.div(pats.length).floor());
    return pat.withEventTime((t) => t.add(offset)).query(state.setSpan(span.withTime((t) => t.sub(offset))));
  };
  return new Pattern(query)._splitQueries();
}

function slowcatPrime(...pats) {
  // Concatenation: combines a list of patterns, switching between them
  // successively, one per cycle. Unlike slowcat, this version will skip cycles.
  pats = pats.map(reify);
  const query = function (state) {
    const pat_n = Math.floor(state.span.begin) % pats.length;
    const pat = pats[pat_n];
    return pat.query(state);
  };
  return new Pattern(query)._splitQueries();
}

function fastcat(...pats) {
  // Concatenation: as with slowcat, but squashes a cycle from each
  // pattern into one cycle
  return slowcat(...pats)._fast(pats.length);
}

function cat(...pats) {
  return fastcat(...pats);
}

function timeCat(...timepats) {
  // Like cat, but where each step has a temporal 'weight'
  const total = timepats.map((a) => a[0]).reduce((a, b) => a.add(b), Fraction(0));
  let begin = Fraction(0);
  const pats = [];
  for (const [time, pat] of timepats) {
    const end = begin.add(time);
    pats.push(reify(pat)._compressSpan(new TimeSpan(begin.div(total), end.div(total))));
    begin = end;
  }
  return stack(...pats);
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

function sequence(...xs) {
  return _sequenceCount(xs)[0];
}

function polymeterSteps(steps, ...args) {
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
      next;
    }
    if (steps == seq[1]) {
      pats.push(seq[0]);
    } else {
      pats.push(seq[0]._fast(Fraction(steps).div(Fraction(seq[1]))));
    }
  }
  return stack(...pats);
}

function polymeter(...args) {
  return polymeterSteps(0, ...args);
}

// alias
function pm(...args) {
  polymeter(...args);
}

function polyrhythm(...xs) {
  const seqs = xs.map((a) => sequence(a));

  if (seqs.length == 0) {
    return silence;
  }
  return stack(...seqs);
}

// alias
function pr(args) {
  polyrhythm(args);
}

const fast = curry((a, pat) => pat.fast(a));
const slow = curry((a, pat) => pat.slow(a));
const early = curry((a, pat) => pat.early(a));
const late = curry((a, pat) => pat.late(a));
const rev = (pat) => pat.rev();
const add = curry((a, pat) => pat.add(a));
const sub = curry((a, pat) => pat.sub(a));
const mul = curry((a, pat) => pat.mul(a));
const div = curry((a, pat) => pat.div(a));
const union = curry((a, pat) => pat.union(a));
const every = curry((i, f, pat) => pat.every(i, f));
const when = curry((binary, f, pat) => pat.when(binary, f));
const off = curry((t, f, pat) => pat.off(t, f));
const jux = curry((f, pat) => pat.jux(f));
const juxBy = curry((by, f, pat) => pat.juxBy(by, f));
const append = curry((a, pat) => pat.append(a));
const superimpose = curry((array, pat) => pat.superimpose(...array));
const struct = curry((a, pat) => pat.struct(a));
const mask = curry((a, pat) => pat.mask(a));
const echo = curry((a, b, c, pat) => pat.echo(a, b, c));
const invert = (pat) => pat.invert();
const inv = (pat) => pat.inv();
const iter = curry((a, pat) => pat.iter(a));
const iterBack = curry((a, pat) => pat.iter(a));
const chunk = curry((a, pat) => pat.chunk(a));
const chunkBack = curry((a, pat) => pat.chunkBack(a));
const ply = curry((a, pat) => pat.ply(a));

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

const patternify2 = (f) => (pata, patb, pat) =>
  pata
    .fmap((a) => (b) => f.call(pat, a, b))
    .appLeft(patb)
    .innerJoin();
const patternify3 = (f) => (pata, patb, patc, pat) =>
  pata
    .fmap((a) => (b) => (c) => f.call(pat, a, b, c))
    .appLeft(patb)
    .appLeft(patc)
    .innerJoin();
const patternify4 = (f) => (pata, patb, patc, patd, pat) =>
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

// call this after all Patter.prototype.define calls have been executed! (right before evaluate)
Pattern.prototype.bootstrap = function () {
  // makeComposable(Pattern.prototype);
  const bootstrapped = Object.fromEntries(
    Object.entries(Pattern.prototype.composable).map(([functionName, composable]) => {
      if (Pattern.prototype[functionName]) {
        // without this, 'C^7'.m.chordBass.transpose(2) will throw "C^7".m.chordBass.transpose is not a function
        Pattern.prototype[functionName] = makeComposable(Pattern.prototype[functionName]); // is this needed?
      }
      return [functionName, curry(composable, makeComposable)];
    }),
  );
  // note: this === Pattern.prototypetgh6z
  this.patternified.forEach((prop) => {
    // the following will patternify all functions in Pattern.prototype.patternified
    Pattern.prototype[prop] = function (...args) {
      return this._patternify(Pattern.prototype['_' + prop])(...args);
    };
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
Pattern.prototype.define('bypass', (pat) => pat.bypass(on), { patternified: true, composable: true });

export {
  Fraction,
  TimeSpan,
  Hap,
  Pattern,
  pure,
  stack,
  slowcat,
  fastcat,
  cat,
  timeCat,
  sequence,
  polymeterSteps,
  polymeter,
  pm,
  polyrhythm,
  pr,
  reify,
  silence,
  fast,
  slow,
  early,
  late,
  rev,
  add,
  sub,
  mul,
  div,
  union,
  every,
  when,
  off,
  jux,
  juxBy,
  append,
  superimpose,
  struct,
  mask,
  invert,
  inv,
  id,
  range,
  echo,
  iter,
  iterBack,
  chunk,
  chunkBack,
  ply,
};
