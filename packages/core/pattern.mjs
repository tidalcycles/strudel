/*
pattern.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/pattern.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import TimeSpan from './timespan.mjs';
import Fraction from './fraction.mjs';
import Hap from './hap.mjs';
import State from './state.mjs';

import { isNote, toMidi, compose, removeUndefineds, flatten, id, listRange, curry, mod } from './util.mjs';
import drawLine from './drawLine.mjs';

export class Pattern {
  // the following functions will get patternFactories as nested functions:
  constructor(query) {
    this.query = query;
  }

  queryArc(begin, end) {
    return this.query(new State(new TimeSpan(begin, end)));
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
        const event_vals = pat_val.query(state.setSpan(hap_func.wholeOrPart()));
        for (const hap_val of event_vals) {
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

  _opLeft(other, func) {
    return this.fmap(func).appLeft(reify(other));
  }
  _opRight(other, func) {
    return this.fmap(func).appRight(reify(other));
  }
  _opBoth(other, func) {
    return this.fmap(func).appBoth(reify(other));
  }
  _opSqueeze(other, func) {
    const otherPat = reify(other);
    return this.fmap((a) => otherPat.fmap((b) => func(a)(b)))._squeezeJoin();
  }
  _opSqueezeFlip(other, func) {
    const thisPat = this;
    const otherPat = reify(other);
    return otherPat.fmap((a) => thisPat.fmap((b) => func(b)(a)))._squeezeJoin();
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

  round() {
    return this._asNumber().fmap((v) => Math.round(v));
  }

  floor() {
    return this._asNumber().fmap((v) => Math.floor(v));
  }

  ceil() {
    return this._asNumber().fmap((v) => Math.ceil(v));
  }

  _toBipolar() {
    return this.fmap((x) => x * 2 - 1);
  }
  _fromBipolar() {
    return this.fmap((x) => (x + 1) / 2);
  }

  // Assumes source pattern of numbers in range 0..1
  range(min, max) {
    return this.mul(max - min).add(min);
  }

  rangex(min, max) {
    return this.range(Math.log(min), Math.log(max)).fmap(Math.exp);
  }

  // Assumes source pattern of numbers in range -1..1
  range2(min, max) {
    return this._fromBipolar().range(min, max);
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

  _compress(b, e) {
    if (b.gt(e) || b.gt(1) || e.gt(1) || b.lt(0) || e.lt(0)) {
      return silence;
    }
    return this._fastGap(Fraction(1).div(e.sub(b)))._late(b);
  }

  _compressSpan(span) {
    return this._compress(span.begin, span.end);
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
    const slices = Array.from({ length: n }, (x, i) => i);
    const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
    const func = function (o) {
      return sequence(slice_objects.map((slice_o) => Object.assign({}, o, slice_o)));
    };
    return this._squeezeBind(func);
  }

  _striate(n) {
    const slices = Array.from({ length: n }, (x, i) => i);
    const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
    const slicePat = slowcat(...slice_objects);
    return this.set(slicePat)._fast(n);
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

  _zoom(s, e) {
    e = Fraction(e);
    s = Fraction(s);
    const d = e.sub(s);
    return this.withQuerySpan((span) => span.withCycle((t) => t.mul(d).add(s)))
      .withEventSpan((span) => span.withCycle((t) => t.sub(s).div(d)))
      ._splitQueries();
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

  log() {
    return this._withEvent((e) => {
      return e.setContext({ ...e.context, logs: (e.context?.logs || []).concat([e.show()]) });
    });
  }

  drawLine() {
    console.log(drawLine(this));
    return this;
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

  stack(...pats) {
    return stack(this, ...pats);
  }

  sequence(...pats) {
    return sequence(this, ...pats);
  }

  // shorthand for sequence
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

  superimpose(...funcs) {
    return this.stack(...funcs.map((func) => func(this)));
  }

  stutWith(times, time, func) {
    return stack(...listRange(0, times - 1).map((i) => func(this.late(Fraction(time).mul(i)), i)));
  }

  stut(times, feedback, time) {
    return this.stutWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
  }

  // these might change with: https://github.com/tidalcycles/Tidal/issues/902
  _echoWith(times, time, func) {
    return stack(...listRange(0, times - 1).map((i) => func(this.late(Fraction(time).mul(i)), i)));
  }

  _echo(times, time, feedback) {
    return this._echoWith(times, time, (pat, i) => pat.velocity(Math.pow(feedback, i)));
  }

  iter(times, back = false) {
    return slowcat(...listRange(0, times - 1).map((i) => (back ? this.late(i / times) : this.early(i / times))));
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

// pattern composers
const composers = {
  set: [
    (a) => (b) => {
      // If an object is involved, do a union, discarding matching keys from a.
      // Otherwise, just return b.
      if (a instanceof Object || b instanceof Object) {
        if (!a instanceof Object) {
          a = { value: a };
        }
        if (!b instanceof Object) {
          b = { value: b };
        }
        return Object.assign({}, a, b);
      }
      return b;
    },
    id,
  ],
  add: [(a) => (b) => a + b, (x) => x._asNumber()],
  sub: [(a) => (b) => a - b, (x) => x._asNumber()],
  mul: [(a) => (b) => a * b, (x) => x._asNumber()],
  div: [(a) => (b) => a / b, (x) => x._asNumber()],
};

for (const [name, op] of Object.entries(composers)) {
  Pattern.prototype[name] = function (...other) {
    return op[1](this)._opLeft(sequence(other), op[0]);
  };
  Pattern.prototype[name + 'Flip'] = function (...other) {
    return op[1](this)._opRight(sequence(other), op[0]);
  };
  Pattern.prototype[name + 'Sect'] = function (...other) {
    return op[1](this)._opBoth(sequence(other), op[0]);
  };
  Pattern.prototype[name + 'Squeeze'] = function (...other) {
    return op[1](this)._opSqueeze(sequence(other), op[0]);
  };
  Pattern.prototype[name + 'SqueezeFlip'] = function (...other) {
    return op[1](this)._opSqueezeFlip(sequence(other), op[0]);
  };
}

// methods of Pattern that get callable factories
Pattern.prototype.patternified = [
  'apply',
  'chop',
  'color',
  'cpm',
  'duration',
  'early',
  'fast',
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
export const silence = new Pattern((_) => []);

export function pure(value) {
  // A discrete value that repeats once per cycle
  function query(state) {
    return state.span.spanCycles.map((subspan) => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value));
  }
  return new Pattern(query);
}

export function isPattern(thing) {
  // thing?.constructor?.name !== 'Pattern' // <- this will fail when code is mangled
  return thing instanceof Pattern;
}

export function reify(thing) {
  // Turns something into a pattern, unless it's already a pattern
  if (isPattern(thing)) {
    return thing;
  }
  return pure(thing);
}

// Basic functions for combining patterns

export function stack(...pats) {
  // Array test here is to avoid infinite recursions..
  pats = pats.map((pat) => (Array.isArray(pat) ? sequence(...pat) : reify(pat)));
  const query = (state) => flatten(pats.map((pat) => pat.query(state)));
  return new Pattern(query);
}

export function slowcat(...pats) {
  // Concatenation: combines a list of patterns, switching between them
  // successively, one per cycle.

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
    return pat.withEventTime((t) => t.add(offset)).query(state.setSpan(span.withTime((t) => t.sub(offset))));
  };
  return new Pattern(query)._splitQueries();
}

export function slowcatPrime(...pats) {
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

export function fastcat(...pats) {
  // Concatenation: as with slowcat, but squashes a cycle from each
  // pattern into one cycle
  return slowcat(...pats)._fast(pats.length);
}

export function cat(...pats) {
  return slowcat(...pats);
}

export function timeCat(...timepats) {
  // Like cat, but where each step has a temporal 'weight'
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

export function sequence(...pats) {
  return fastcat(...pats);
}

// shorthand for sequence
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

export function polymeter(...args) {
  return polymeterSteps(0, ...args);
}

// alias
export function pm(...args) {
  polymeter(...args);
}

export function polyrhythm(...xs) {
  const seqs = xs.map((a) => sequence(a));

  if (seqs.length == 0) {
    return silence;
  }
  return stack(...seqs);
}

// alias
export function pr(args) {
  polyrhythm(args);
}

export const add = curry((a, pat) => pat.add(a));
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
export const iterBack = curry((a, pat) => pat.iter(a));
export const jux = curry((f, pat) => pat.jux(f));
export const juxBy = curry((by, f, pat) => pat.juxBy(by, f));
export const late = curry((a, pat) => pat.late(a));
export const linger = curry((a, pat) => pat.linger(a));
export const mask = curry((a, pat) => pat.mask(a));
export const mul = curry((a, pat) => pat.mul(a));
export const off = curry((t, f, pat) => pat.off(t, f));
export const ply = curry((a, pat) => pat.ply(a));
export const range = curry((a, b, pat) => pat.range(a, b));
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
Pattern.prototype.zoom = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._zoom)(...args, this);
};
Pattern.prototype.compress = function (...args) {
  args = args.map(reify);
  return patternify2(Pattern.prototype._compress)(...args, this);
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
