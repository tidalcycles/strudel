import Fraction from "./fraction.js";
import {compose} from "../pkg/ramda.js";
import {isNote, toMidi} from "./util.js";
const removeUndefineds = (xs) => xs.filter((x) => x != void 0);
const flatten = (arr) => [].concat(...arr);
const id = (a) => a;
export function curry(func, overload) {
  const fn = function curried(...args) {
    if (args.length >= func.length) {
      return func.apply(this, args);
    } else {
      const partial = function(...args2) {
        return curried.apply(this, args.concat(args2));
      };
      if (overload) {
        overload(partial, args);
      }
      return partial;
    }
  };
  if (overload) {
    overload(fn, []);
  }
  return fn;
}
Fraction.prototype.sam = function() {
  return this.floor();
};
Fraction.prototype.nextSam = function() {
  return this.sam().add(1);
};
Fraction.prototype.wholeCycle = function() {
  return new TimeSpan(this.sam(), this.nextSam());
};
Fraction.prototype.lt = function(other) {
  return this.compare(other) < 0;
};
Fraction.prototype.gt = function(other) {
  return this.compare(other) > 0;
};
Fraction.prototype.lte = function(other) {
  return this.compare(other) <= 0;
};
Fraction.prototype.gte = function(other) {
  return this.compare(other) >= 0;
};
Fraction.prototype.eq = function(other) {
  return this.compare(other) == 0;
};
Fraction.prototype.max = function(other) {
  return this.gt(other) ? this : other;
};
Fraction.prototype.min = function(other) {
  return this.lt(other) ? this : other;
};
Fraction.prototype.show = function() {
  return this.s * this.n + "/" + this.d;
};
Fraction.prototype.or = function(other) {
  return this.eq(0) ? other : this;
};
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
      if (begin.sam().equals(end_sam)) {
        spans.push(new TimeSpan(begin, this.end));
        break;
      }
      const next_begin = begin.nextSam();
      spans.push(new TimeSpan(begin, next_begin));
      begin = next_begin;
    }
    return spans;
  }
  withTime(func_time) {
    return new TimeSpan(func_time(this.begin), func_time(this.end));
  }
  withEnd(func_time) {
    return new TimeSpan(this.begin, func_time(this.end));
  }
  intersection(other) {
    const intersect_begin = this.begin.max(other.begin);
    const intersect_end = this.end.min(other.end);
    if (intersect_begin.gt(intersect_end)) {
      return void 0;
    }
    if (intersect_begin.equals(intersect_end)) {
      if (intersect_begin.equals(this.end) && this.begin.lt(this.end)) {
        return void 0;
      }
      if (intersect_begin.equals(other.end) && other.begin.lt(other.end)) {
        return void 0;
      }
    }
    return new TimeSpan(intersect_begin, intersect_end);
  }
  intersection_e(other) {
    const result = this.intersection(other);
    if (result == void 0) {
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
    return this.begin.show() + " -> " + this.end.show();
  }
}
class Hap {
  constructor(whole, part, value, context = {}, stateful = false) {
    this.whole = whole;
    this.part = part;
    this.value = value;
    this.context = context;
    this.stateful = stateful;
    if (stateful) {
      console.assert(typeof this.value === "function", "Stateful values must be functions");
    }
  }
  withSpan(func) {
    const whole = this.whole ? func(this.whole) : void 0;
    return new Hap(whole, func(this.part), this.value, this.context);
  }
  withValue(func) {
    return new Hap(this.whole, this.part, func(this.value), this.context);
  }
  hasOnset() {
    return this.whole != void 0 && this.whole.begin.equals(this.part.begin);
  }
  resolveState(state) {
    if (this.stateful && this.hasOnset()) {
      console.log("stateful");
      const func = this.value;
      const [newState, newValue] = func(state);
      return [newState, new Hap(this.whole, this.part, newValue, this.context, false)];
    }
    return [state, this];
  }
  spanEquals(other) {
    return this.whole == void 0 && other.whole == void 0 || this.whole.equals(other.whole);
  }
  equals(other) {
    return this.spanEquals(other) && this.part.equals(other.part) && this.value === other.value;
  }
  show() {
    return "(" + (this.whole == void 0 ? "~" : this.whole.show()) + ", " + this.part.show() + ", " + this.value + ")";
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
  setSpan(span) {
    return new State(span, this.controls);
  }
  withSpan(func) {
    return this.setSpan(func(this.span));
  }
  setControls(controls) {
    return new State(this.span, controls);
  }
}
class Pattern {
  constructor(query) {
    this.query = query;
  }
  _splitQueries() {
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
    return new Pattern((state) => this.query(state.withSpan((span) => span.withTime(func))));
  }
  withEventSpan(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withSpan(func)));
  }
  withEventTime(func) {
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
  withLocation(location) {
    return this._withContext((context) => {
      const locations = (context.locations || []).concat([location]);
      return {...context, locations};
    });
  }
  withValue(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withValue(func)));
  }
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
    return this._filterValues((val) => val != void 0);
  }
  onsetsOnly() {
    return this._filterEvents((hap) => hap.hasOnset());
  }
  _appWhole(whole_func, pat_val) {
    const pat_func = this;
    const query = function(state) {
      const event_funcs = pat_func.query(state);
      const event_vals = pat_val.query(state);
      const apply = function(event_func, event_val) {
        const s = event_func.part.intersection(event_val.part);
        if (s == void 0) {
          return void 0;
        }
        return new Hap(whole_func(event_func.whole, event_val.whole), s, event_func.value(event_val.value), event_val.context);
      };
      return flatten(event_funcs.map((event_func) => removeUndefineds(event_vals.map((event_val) => apply(event_func, event_val)))));
    };
    return new Pattern(query);
  }
  appBoth(pat_val) {
    const whole_func = function(span_a, span_b) {
      if (span_a == void 0 || span_b == void 0) {
        return void 0;
      }
      return span_a.intersection_e(span_b);
    };
    return this._appWhole(whole_func, pat_val);
  }
  appLeft(pat_val) {
    const pat_func = this;
    const query = function(state) {
      const haps = [];
      for (const hap_func of pat_func.query(state)) {
        const event_vals = pat_val.query(state.setSpan(hap_func.part));
        for (const hap_val of event_vals) {
          const new_whole = hap_func.whole;
          const new_part = hap_func.part.intersection_e(hap_val.part);
          const new_value = hap_func.value(hap_val.value);
          const hap = new Hap(new_whole, new_part, new_value, {
            ...hap_val.context,
            ...hap_func.context,
            locations: (hap_val.context.locations || []).concat(hap_func.context.locations || [])
          });
          haps.push(hap);
        }
      }
      return haps;
    };
    return new Pattern(query);
  }
  appRight(pat_val) {
    const pat_func = this;
    const query = function(state) {
      const haps = [];
      for (const hap_val of pat_val.query(state)) {
        const hap_funcs = pat_func.query(state.setSpan(hap_val.part));
        for (const hap_func of hap_funcs) {
          const new_whole = hap_val.whole;
          const new_part = hap_func.part.intersection_e(hap_val.part);
          const new_value = hap_func.value(hap_val.value);
          const hap = new Hap(new_whole, new_part, new_value, {
            ...hap_func.context,
            ...hap_val.context,
            locations: (hap_val.context.locations || []).concat(hap_func.context.locations || [])
          });
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
  _sortEventsByPart() {
    return this._withEvents((events) => events.sort((a, b) => a.part.begin.sub(b.part.begin).or(a.part.end.sub(b.part.end)).or(a.whole.begin.sub(b.whole.begin).or(a.whole.end.sub(b.whole.end)))));
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
        pi: Math.PI
      }[event.value];
      if (typeof specialValue !== "undefined") {
        return event.withValue(() => specialValue);
      }
      if (isNote(event.value)) {
        return new Hap(event.whole, event.part, toMidi(event.value), {...event.context, type: "midi"});
      }
      if (!silent) {
        throw new Error('cannot parse as number: "' + event.value + '"');
      }
      return event.withValue(() => void 0);
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
    const query = function(state) {
      const withWhole = function(a, b) {
        return new Hap(choose_whole(a.whole, b.whole), b.part, b.value, {
          ...a.context,
          ...b.context,
          locations: (a.context.locations || []).concat(b.context.locations || [])
        });
      };
      const match = function(a) {
        return func(a.value).query(state.setSpan(a.part)).map((b) => withWhole(a, b));
      };
      return flatten(pat_val.query(state).map((a) => match(a)));
    };
    return new Pattern(query);
  }
  bind(func) {
    const whole_func = function(a, b) {
      if (a == void 0 || b == void 0) {
        return void 0;
      }
      return a.intersection_e(b);
    };
    return this._bindWhole(whole_func, func);
  }
  join() {
    return this.bind(id);
  }
  innerBind(func) {
    return this._bindWhole((a, _) => a, func);
  }
  innerJoin() {
    return this.innerBind(id);
  }
  outerBind(func) {
    return this._bindWhole((_, b) => b, func);
  }
  outerJoin() {
    return this.outerBind(id);
  }
  _apply(func) {
    return func(this);
  }
  layer(...funcs) {
    return stack(...funcs.map((func) => func(this)));
  }
  _patternify(func) {
    const pat = this;
    const patterned = function(...args) {
      args = args.map((arg) => arg.constructor?.name === "Pattern" ? arg.fmap((value) => value.value || value) : arg);
      const pat_arg = sequence(...args);
      return pat_arg.fmap((arg) => func.call(pat, arg)).outerJoin();
    };
    return patterned;
  }
  _fastGap(factor) {
    const qf = function(span) {
      const cycle = span.begin.sam();
      const begin = cycle.add(span.begin.sub(cycle).mul(factor).min(1));
      const end = cycle.add(span.end.sub(cycle).mul(factor).min(1));
      return new TimeSpan(begin, end);
    };
    const ef = function(span) {
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
  _early(offset) {
    offset = Fraction(offset);
    return this.withQueryTime((t) => t.add(offset)).withEventTime((t) => t.sub(offset));
  }
  _late(offset) {
    offset = Fraction(offset);
    return this._early(Fraction(0).sub(offset));
  }
  struct(...binary_pats) {
    const binary_pat = sequence(binary_pats);
    return binary_pat.fmap((b) => (val) => b ? val : void 0).appLeft(this)._removeUndefineds();
  }
  mask(...binary_pats) {
    const binary_pat = sequence(binary_pats);
    return binary_pat.fmap((b) => (val) => b ? val : void 0).appRight(this)._removeUndefineds();
  }
  _segment(rate) {
    return this.struct(pure(true).fast(rate));
  }
  invert() {
    return this.fmap((x) => !x);
  }
  inv() {
    return this.invert();
  }
  when(binary_pat, func) {
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
    const query = function(state) {
      const span = state.span;
      const cycle = span.begin.sam();
      const next_cycle = span.begin.nextSam();
      const reflect = function(to_reflect) {
        const reflected = to_reflect.withTime((time) => cycle.add(next_cycle.sub(time)));
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
  jux(func, by = 1) {
    by /= 2;
    const elem_or = function(dict, key, dflt) {
      if (key in dict) {
        return dict[key];
      }
      return dflt;
    };
    const left = this.withValue((val) => Object.assign({}, val, {pan: elem_or(val, "pan", 0.5) - by}));
    const right = this.withValue((val) => Object.assign({}, val, {pan: elem_or(val, "pan", 0.5) + by}));
    return stack(left, func(right));
  }
  stack(...pats) {
    return stack(this, ...pats);
  }
  sequence(...pats) {
    return sequence(this, ...pats);
  }
  superimpose(...funcs) {
    return this.stack(...funcs.map((func) => func(this)));
  }
  edit(...funcs) {
    return stack(...funcs.map((func) => func(this)));
  }
  pipe(func) {
    return func(this);
  }
  _bypass(on2) {
    on2 = Boolean(parseInt(on2));
    return on2 ? silence : this;
  }
  hush() {
    return silence;
  }
  _duration(value) {
    return this.withEventSpan((span) => new TimeSpan(span.begin, span.begin.add(value)));
  }
  _legato(value) {
    return this.withEventSpan((span) => new TimeSpan(span.begin, span.begin.add(span.end.sub(span.begin).mul(value))));
  }
  _velocity(velocity) {
    return this._withContext((context) => ({...context, velocity: (context.velocity || 1) * velocity}));
  }
}
Pattern.prototype.patternified = ["apply", "fast", "slow", "early", "late", "duration", "legato", "velocity", "segment"];
Pattern.prototype.factories = {pure, stack, slowcat, fastcat, cat, timeCat, sequence, polymeter, pm, polyrhythm, pr};
const silence = new Pattern((_) => []);
function pure(value) {
  function query(state) {
    return state.span.spanCycles.map((subspan) => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value));
  }
  return new Pattern(query);
}
function steady(value) {
  return new Pattern((span) => Hap(void 0, span, value));
}
export const signal = (func) => {
  const query = (state) => [new Hap(void 0, state.span, func(state.span.midpoint()))];
  return new Pattern(query);
};
const _toBipolar = (pat) => pat.fmap((x) => x * 2 - 1);
const _fromBipolar = (pat) => pat.fmap((x) => (x + 1) / 2);
export const sine2 = signal((t) => Math.sin(Math.PI * 2 * t));
export const sine = _fromBipolar(sine2);
export const cosine2 = sine2._early(0.25);
export const cosine = sine._early(0.25);
export const saw = signal((t) => t % 1);
export const saw2 = _toBipolar(saw);
export const isaw = signal((t) => 1 - t % 1);
export const isaw2 = _toBipolar(isaw);
export const tri2 = fastcat(isaw2, saw2);
export const tri = fastcat(isaw, saw);
export const square = signal((t) => Math.floor(t * 2 % 2));
export const square2 = _toBipolar(square);
function reify(thing) {
  if (thing?.constructor?.name == "Pattern") {
    return thing;
  }
  return pure(thing);
}
function stack(...pats) {
  const reified = pats.map((pat) => reify(pat));
  const query = (state) => flatten(reified.map((pat) => pat.query(state)));
  return new Pattern(query);
}
function slowcat(...pats) {
  pats = pats.map(reify);
  const query = function(state) {
    const span = state.span;
    const pat_n = Math.floor(span.begin) % pats.length;
    const pat = pats[pat_n];
    if (!pat) {
      return [];
    }
    const offset = span.begin.floor().sub(span.begin.div(pats.length).floor());
    return pat.withEventTime((t) => t.add(offset)).query(state.setSpan(span.withTime((t) => t.sub(offset))));
  };
  return new Pattern(query)._splitQueries();
}
function slowcatPrime(...pats) {
  pats = pats.map(reify);
  const query = function(state) {
    const pat_n = Math.floor(state.span.begin) % pats.length;
    const pat = pats[pat_n];
    return pat.query(state);
  };
  return new Pattern(query)._splitQueries();
}
function fastcat(...pats) {
  return slowcat(...pats)._fast(pats.length);
}
function cat(...pats) {
  return fastcat(...pats);
}
function timeCat(...timepats) {
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
function polymeter(steps = 0, ...args) {
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
  return stack(pats);
}
function pm(args) {
  polymeter(args);
}
function polyrhythm(...xs) {
  const seqs = xs.map((a) => sequence(a));
  if (seqs.length == 0) {
    return silence;
  }
  return stack(...seqs);
}
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
const append = curry((a, pat) => pat.append(a));
const superimpose = curry((array, pat) => pat.superimpose(...array));
const struct = curry((a, pat) => pat.struct(a));
const mask = curry((a, pat) => pat.mask(a));
const invert = (pat) => pat.invert();
const inv = (pat) => pat.inv();
Pattern.prototype.composable = {fast, slow, early, late, superimpose};
export function makeComposable(func) {
  Object.entries(Pattern.prototype.composable).forEach(([functionName, composable]) => {
    func[functionName] = (...args) => {
      const composition = compose(func, composable(...args));
      return makeComposable(composition);
    };
  });
  return func;
}
Pattern.prototype.bootstrap = function() {
  const bootstrapped = Object.fromEntries(Object.entries(Pattern.prototype.composable).map(([functionName, composable]) => {
    if (Pattern.prototype[functionName]) {
      Pattern.prototype[functionName] = makeComposable(Pattern.prototype[functionName]);
    }
    return [functionName, curry(composable, makeComposable)];
  }));
  this.patternified.forEach((prop) => {
    Pattern.prototype[prop] = function(...args) {
      return this._patternify(Pattern.prototype["_" + prop])(...args);
    };
  });
  return bootstrapped;
};
Pattern.prototype.define = (name, func, options = {}) => {
  if (options.composable) {
    Pattern.prototype.composable[name] = func;
  }
  if (options.patternified) {
    Pattern.prototype.patternified = Pattern.prototype.patternified.concat([name]);
  }
  Pattern.prototype.bootstrap();
};
Pattern.prototype.define("hush", (pat) => pat.hush(), {patternified: false, composable: true});
Pattern.prototype.define("bypass", (pat) => pat.bypass(on), {patternified: true, composable: true});
function withLocationOffset(pat, offset) {
  return pat._withContext((context) => {
    let locations = context.locations || [];
    locations = locations.map(({start, end}) => {
      const colOffset = start.line === 1 ? offset.start.column : 0;
      return {
        start: {
          ...start,
          line: start.line - 1 + (offset.start.line - 1) + 1,
          column: start.column - 1 + colOffset
        },
        end: {
          ...end,
          line: end.line - 1 + (offset.start.line - 1) + 1,
          column: end.column - 1 + colOffset
        }
      };
    });
    return {...context, locations};
  });
}
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
  append,
  superimpose,
  struct,
  mask,
  invert,
  inv,
  withLocationOffset
};
