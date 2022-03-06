import Fraction from 'fraction.js'
import { compose } from 'ramda'; // will remove this as soon as compose is implemented here

// Removes 'None' values from given list
const removeUndefineds = xs => xs.filter(x => x != undefined)

const flatten = arr => [].concat(...arr)

const id = a => a

export function curry(func, overload) {
    const fn = function curried(...args) {
        if (args.length >= func.length) {
            return func.apply(this, args)
        } 
        else {
            const partial = function(...args2) {
                return curried.apply(this, args.concat(args2))
            }
            if (overload) {
                overload(partial, args);
            }
            return partial;
        }
    }
    if (overload) { // overload function without args... needed for chordBass.transpose(2)
        overload(fn, []); 
    }
    return fn;
}

// Returns the start of the cycle.
Fraction.prototype.sam = function() {
    return Fraction(Math.floor(this))
}

// Returns the start of the next cycle.
Fraction.prototype.nextSam = function() {
    return this.sam().add(1)
}

// Returns a TimeSpan representing the begin and end of the Time value's cycle
Fraction.prototype.wholeCycle = function() {
    return new TimeSpan(this.sam(), this.nextSam())
}

Fraction.prototype.lt = function(other) {
    return this.compare(other) < 0
}

Fraction.prototype.gt = function(other) {
    return this.compare(other) > 0
}

Fraction.prototype.lte = function(other) {
    return this.compare(other) <= 0
}

Fraction.prototype.gte = function(other) {
    return this.compare(other) >= 0
}

Fraction.prototype.eq = function(other) {
    return this.compare(other) == 0
}

Fraction.prototype.max = function(other) {
    return this.gt(other) ? this : other
}

Fraction.prototype.min = function(other) {
    return this.lt(other) ? this : other
}

Fraction.prototype.show = function () {
    return (this.s * this.n) + "/" + this.d
}

Fraction.prototype.or = function(other) {
    return this.eq(0) ? other : this
}

class TimeSpan {
    constructor(begin, end) {
        this.begin = Fraction(begin)
        this.end = Fraction(end)
    }

    get spanCycles() {
        const spans = []
        var begin = this.begin
        const end = this.end
        const end_sam = end.sam()

        while (end.gt(begin)) {
            // If begin and end are in the same cycle, we're done.
            if (begin.sam().equals(end_sam)) {
                spans.push(new TimeSpan(begin, this.end))
                break
            }
            // add a timespan up to the next sam
            const next_begin = begin.nextSam()
            spans.push(new TimeSpan(begin, next_begin))

            // continue with the next cycle
            begin = next_begin
        }
        return(spans)
    }

    withTime(func_time) {
      // Applies given function to both the begin and end time value of the timespan"""
      return(new TimeSpan(func_time(this.begin), func_time(this.end)))
    }
    withEnd(func_time) {
      // Applies given function to both the begin and end time value of the timespan"""
      return(new TimeSpan(this.begin, func_time(this.end)))
    }

    intersection(other) {
        // Intersection of two timespans, returns None if they don't intersect.
        const intersect_begin = this.begin.max(other.begin)
        const intersect_end = this.end.min(other.end)

        if (intersect_begin.gt(intersect_end)) {
            return(undefined)
        }
        if (intersect_begin.equals(intersect_end)) {
            // Zero-width (point) intersection - doesn't intersect if it's at the end of a
            // non-zero-width timespan.
            if (intersect_begin.equals(this.end) && this.begin.lt(this.end)) {
                return(undefined)
            }
            if (intersect_begin.equals(other.end) && other.begin.lt(other.end)) {
                return(undefined)
            }
        }
        return(new TimeSpan(intersect_begin, intersect_end))
    }

    intersection_e(other) {
        // Like 'sect', but raises an exception if the timespans don't intersect.
        const result = this.intersection(other)
        if (result == undefined) {
            // TODO - raise exception
            // raise ValueError(f'TimeSpan {self} and TimeSpan {other} do not intersect')
        }
        return result
    }

    midpoint() {
        return(this.begin.add((this.end.sub(this.begin)).div(Fraction(2))))
    }

    equals(other) {
        return this.begin.equals(other.begin) && this.end.equals(other.end)
    }

    show() {
        return this.begin.show() + " -> " + this.end.show()
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
        this.whole = whole
        this.part = part
        this.value = value
        this.context = context
        this.stateful = stateful
        if (stateful) {
            console.assert(typeof this.value === "function", "Stateful values must be functions");
        }
    }

    withSpan(func) {
        // Returns a new event with the function f applies to the event timespan.
        const whole = this.whole ? func(this.whole) : undefined
        return new Hap(whole, func(this.part), this.value, this.context)
    }

    withValue(func) {
        // Returns a new event with the function f applies to the event value.
        return new Hap(this.whole, this.part, func(this.value), this.context)
    }

    hasOnset() {
        // Test whether the event contains the onset, i.e that
        // the beginning of the part is the same as that of the whole timespan."""
        return (this.whole != undefined) && (this.whole.begin.equals(this.part.begin))
    }

    resolveState(state) {
        if (this.stateful && this.hasOnset()) {
            console.log("stateful")
            const func = this.value
            const [newState, newValue] = func(state)
            return [newState, new Hap(this.whole, this.part, newValue, this.context, false)]
        }
        return [state, this]
    }

    spanEquals(other) {
        return((this.whole == undefined && other.whole == undefined)
               || this.whole.equals(other.whole)
              )
    }

    equals(other) {
        return(this.spanEquals(other)
               && this.part.equals(other.part)
               // TODO would == be better ??
               && this.value === other.value
        )
    }

    show() {
        return "(" + (this.whole == undefined ? "~" : this.whole.show()) + ", " + this.part.show() + ", " + this.value + ")"
    }

    setContext(context) {
        return new Hap(this.whole, this.part, this.value, context)
    }
}

export class State {
    constructor(span, controls={}) {
        this.span = span
        this.controls = controls
    }

    // Returns new State with different span
    setSpan(span) {
        return new State(span, this.controls)
    }

    withSpan(func) {
        return this.setSpan(func(this.span))
    }

    // Returns new State with different controls
    setControls(controls) {
        return new State(this.span, controls)
    }
}

class Pattern {
    // the following functions will get patternFactories as nested functions:
    constructor(query) {
        this.query = query;
        // the following code will assign `patternFactories` as child functions to all methods of Pattern that don't start with '_'
        const proto = Object.getPrototypeOf(this);
        // proto.patternified is defined below Pattern class. You can add more patternified functions from outside.
        proto.patternified.forEach((prop) => {
          // patternify function
          this[prop] = (...args) => this._patternify(Pattern.prototype['_' + prop])(...args);
          // with the following, you can do, e.g. `stack(c3).fast.slowcat(1, 2, 4, 8)` instead of `stack(c3).fast(slowcat(1, 2, 4, 8))`
          Object.assign(
            this[prop],
            Object.fromEntries(
              Object.entries(Pattern.prototype.factories).map(([type, func]) => [
                type,
                (...args) => this[prop](func(...args)),
              ])
            )
          );
        });
    }

    _splitQueries() {
        // Splits queries at cycle boundaries. This makes some calculations 
        // easier to express, as all events are then constrained to happen within 
        // a cycle.
        const pat = this
        const q = state => {
            return flatten(state.span.spanCycles.map(subspan => pat.query(state.setSpan(subspan))))
        }
        return new Pattern(q)
    }


    withQuerySpan(func) {
        return new Pattern(state => this.query(state.withSpan(func)))
    }

    withQueryTime(func) {
        // Returns a new pattern, with the function applied to both the begin
        // and end of the the query timespan
        return new Pattern(state => this.query(state.withSpan(span => span.withTime(func))))
    }

    withEventSpan(func) {
        // Returns a new pattern, with the function applied to each event
        // timespan.
        return new Pattern(state => this.query(state).map(hap => hap.withSpan(func)))
    }

    withEventTime(func) {
        // Returns a new pattern, with the function applied to both the begin
        // and end of each event timespan. 
        return this.withEventSpan(span => span.withTime(func))
    }

    _withEvents(func) {
        return new Pattern(state => func(this.query(state)))
    }

    _withEvent(func) {
        return this._withEvents(events => events.map(func))
    }

    _setContext(context) {
        return this._withEvent(event => event.setContext(context))
    }

    _withContext(func) {
        return this._withEvent(event => event.setContext(func(event.context)))
    }

    _stripContext() {
        return this._withEvent(event => event.setContext({}))
    }

    withLocation(location) {
      return this._withContext((context) => {
        const locations = (context.locations || []).concat([location])
        return { ...context, locations }
      });
    }

    withValue(func) {
        // Returns a new pattern, with the function applied to the value of
        // each event. It has the alias 'fmap'.
        return new Pattern(state => this.query(state).map(hap => hap.withValue(func)))
    }

    // alias
    fmap(func) {
        return this.withValue(func)
    }

    _filterEvents(event_test) {
        return new Pattern(state => this.query(state).filter(event_test))
    }

    _filterValues(value_test) {
         return new Pattern(state => this.query(state).filter(hap => value_test(hap.value)))
    }

    _removeUndefineds() {
        return(this._filterValues(val => val != undefined))
    }

    onsetsOnly() {
        // Returns a new pattern that will only return events where the start
        // of the 'whole' timespan matches the start of the 'part'
        // timespan, i.e. the events that include their 'onset'.
        return(this._filterEvents(hap => hap.hasOnset()))
    }

    _appWhole(whole_func, pat_val) {
        // Assumes 'this' is a pattern of functions, and given a function to
        // resolve wholes, applies a given pattern of values to that
        // pattern of functions.
        const pat_func = this
        const query = function(state) {
            const event_funcs = pat_func.query(state)
            const event_vals = pat_val.query(state)
            const apply = function(event_func, event_val) {
                const s = event_func.part.intersection(event_val.part)
                if (s == undefined) {
                    return undefined
                }
                // TODO: is it right to add event_val.context here?
                return new Hap(whole_func(event_func.whole, event_val.whole), s, event_func.value(event_val.value), event_val.context)
            }
            return flatten(event_funcs.map(event_func => removeUndefineds(event_vals.map(event_val => apply(event_func, event_val)))))
        }
        return new Pattern(query)
    }

    appBoth(pat_val) {
        // Tidal's <*>
        const whole_func = function(span_a, span_b) {
            if (span_a == undefined || span_b == undefined) {
                return undefined
            }
            return span_a.intersection_e(span_b)
        }
        return this._appWhole(whole_func, pat_val)
    }

    appLeft(pat_val) {
        const pat_func = this

        const query = function(state) {
            const haps = []
            for (const hap_func of pat_func.query(state)) {
                const event_vals = pat_val.query(state.setSpan(hap_func.part))
                for (const hap_val of event_vals) {
                    const new_whole = hap_func.whole
                    const new_part = hap_func.part.intersection_e(hap_val.part)
                    const new_value = hap_func.value(hap_val.value)
                    const hap = new Hap(new_whole, new_part, new_value, {
                      ...hap_val.context,
                      ...hap_func.context,
                      locations: (hap_val.context.locations || []).concat(hap_func.context.locations || []),
                    });
                    haps.push(hap)
                }
            }
            return haps
        }
        return new Pattern(query)
    }

    appRight(pat_val) {
        const pat_func = this

        const query = function(state) {
            const haps = []
            for (const hap_val of pat_val.query(state)) {
                const hap_funcs = pat_func.query(state.setSpan(hap_val.part))
                for (const hap_func of hap_funcs) {
                    const new_whole = hap_val.whole
                    const new_part = hap_func.part.intersection_e(hap_val.part)
                    const new_value = hap_func.value(hap_val.value)
                    const hap = new Hap(new_whole, new_part, new_value, {
                      ...hap_func.context,
                      ...hap_val.context,
                      locations: (hap_val.context.locations || []).concat(hap_func.context.locations || []),
                    })
                    haps.push(hap)
                }
            }
            return haps
        }
        return new Pattern(query)
    }

    firstCycle(with_context=false) {
        var self = this
        if (!with_context) {
            self = self._stripContext()
        }
        return self.query(new State(new TimeSpan(Fraction(0), Fraction(1))))
    }

    _sortEventsByPart() {
        return this._withEvents(events => events.sort((a,b) => a.part.begin.sub(b.part.begin).or(a.part.end.sub(b.part.end)).or(a.whole.begin.sub(b.whole.begin).or(a.whole.end.sub(b.whole.end)))))
    }

    _opleft(other, func) {
        return this.fmap(func).appLeft(reify(other))
    }

    add(other) {
        return this._opleft(other, a => b => a + b)
    }

    sub(other) {
        return this._opleft(other, a => b => a - b)
    }
    
    mul(other) {
        return this._opleft(other, a => b => a * b)
    }

    div(other) {
        return this._opleft(other, a => b => a / b)
    }

    union(other) {
        return this._opleft(other, a => b => Object.assign({}, a, b))
    }
    
    _bindWhole(choose_whole, func) {
        const pat_val = this
        const query = function(state) {
            const withWhole = function(a, b) {
                return new Hap(choose_whole(a.whole, b.whole), b.part, b.value, {
                  ...a.context,
                  ...b.context,
                  locations: (a.context.locations || []).concat(b.context.locations || []),
                });
            }
            const match = function (a) {
                return func(a.value).query(state.setSpan(a.part)).map(b => withWhole(a, b))
            }
            return flatten(pat_val.query(state).map(a => match(a)))
        }
        return new Pattern(query)
    }

    bind(func) {
        const whole_func = function(a, b) {
            if (a == undefined || b == undefined) {
                return undefined
            }
            return a.intersection_e(b)
        }
        return this._bindWhole(whole_func, func)
    }

    join() {
        // Flattens a pattern of patterns into a pattern, where wholes are
        // the intersection of matched inner and outer events.
        return this.bind(id)
    }

    innerBind(func) {
        return this._bindWhole((a, _) => a, func)
    }

    innerJoin() {
        // Flattens a pattern of patterns into a pattern, where wholes are
        // taken from inner events.
        return this.innerBind(id)
    }
    
    outerBind(func) {
        return this._bindWhole((_, b) => b, func)
    }

    outerJoin() {
        // Flattens a pattern of patterns into a pattern, where wholes are
        // taken from inner events.
        return this.outerBind(id)
    }

    _apply(func) {
        return func(this)
    }

    layer(...funcs) {
        return stack(...funcs.map(func => func(this)))
    }

    _patternify(func) {
        const pat = this
        const patterned = function (...args) {
          // the problem here: args could a pattern that has been turned into an object to add location
          // to avoid object checking for every pattern method, we can remove it here...
          // in the future, patternified args should be marked as well + some better object handling
           args = args.map((arg) =>
            arg.constructor?.name === 'Pattern' ? arg.fmap((value) => value.value || value) : arg
           );
           const pat_arg = sequence(...args)
           // arg.locations has to go somewhere..
           return pat_arg.fmap(arg => func.call(pat,arg)).outerJoin()
        }
        return patterned
   }

   _fastGap (factor) {
        // Maybe it's better without this fallback..
        // if (factor < 1) {
        //     // there is no gap.. so maybe revert to _fast?
        //     return this._fast(factor)
        // }
        const qf = function(span) { 
            const cycle = span.begin.sam()
            const begin = cycle.add(span.begin.sub(cycle).mul(factor).min(1))
            const end   = cycle.add(span.end.sub(cycle).mul(factor).min(1))
            return new TimeSpan(begin, end)
        }
        const ef = function(span) { 
            const cycle = span.begin.sam()
            const begin = cycle.add(span.begin.sub(cycle).div(factor).min(1))
            const end   = cycle.add(span.end.sub(cycle).div(factor).min(1))
            return new TimeSpan(begin, end)
        }
        return this.withQuerySpan(qf).withEventSpan(ef)._splitQueries()
    }

    _compressSpan(span) {
        const b = span.begin
        const e = span.end
        if (b > e || b > 1 || e > 1 || b < 0 || e < 0) {
            return silence
        }
        return this._fastGap(Fraction(1).div(e.sub(b)))._late(b)
    }

    _fast(factor) {
        const fastQuery = this.withQueryTime(t => t.mul(factor))
        return fastQuery.withEventTime(t => t.div(factor))
    }

    _slow(factor) {
        return this._fast(1/factor)
    }

    _early(offset) {
        // Equivalent of Tidal's <~ operator
        offset = Fraction(offset)
        return this.withQueryTime(t => t.add(offset)).withEventTime(t => t.sub(offset))
    }

    _late(offset) {
        // Equivalent of Tidal's ~> operator
        return this._early(0-offset)
    }

    struct(...binary_pats) {
        // Re structure the pattern according to a binary pattern (false values are dropped)
        const binary_pat = sequence(binary_pats)
        return binary_pat.fmap(b => val => b ? val : undefined).appLeft(this)._removeUndefineds()        
    }

    mask(...binary_pats) {
        // Only let through parts of pattern corresponding to true values in the given binary pattern
        const binary_pat = sequence(binary_pats)
        return binary_pat.fmap(b => val => b ? val : undefined).appRight(this)._removeUndefineds()        
    }

    invert() {
        // Swap true/false in a binary pattern
        return this.fmap(x => !x)
    }

    inv() {
        // alias for invert()
        return this.invert()
    }

    when(binary_pat, func) {
        //binary_pat = sequence(binary_pat)
        const true_pat = binary_pat._filterValues(id)
        const false_pat = binary_pat._filterValues(val => !val)
        const with_pat = true_pat.fmap(_ => y => y).appRight(func(this))
        const without_pat = false_pat.fmap(_ => y => y).appRight(this)
        return stack(with_pat, without_pat)
    }

    off(time_pat, func) {
        return stack(this, func(this.late(time_pat)))
    }

    every(n, func) {
        const pat = this
        const pats = Array(n-1).fill(pat)
        pats.unshift(func(pat))
        return slowcatPrime(...pats)
    }

    append(other) {
        return fastcat(...[this, other])
    }

    rev() {
        const pat = this
        const query = function(state) {
            const span = state.span
            const cycle = span.begin.sam()
            const next_cycle = span.begin.nextSam()
            const reflect = function(to_reflect) {
                const reflected = to_reflect.withTime(time => cycle.add(next_cycle.sub(time)))
                // [reflected.begin, reflected.end] = [reflected.end, reflected.begin] -- didn't work
                const tmp = reflected.begin
                reflected.begin = reflected.end
                reflected.end = tmp
                return reflected
            }
            const haps = pat.query(state.setSpan(reflect(span)))
            return haps.map(hap => hap.withSpan(reflect))
        }
        return new Pattern(query)._splitQueries()
    }

    jux(func, by=1) {
        by /= 2
        const elem_or = function(dict, key, dflt) {
            if (key in dict) {
                return dict[key]
            }
            return dflt
        }
        const left = this.withValue(val => Object.assign({}, val, {pan: elem_or(val, "pan", 0.5) - by}))
        const right = this.withValue(val => Object.assign({}, val, {pan: elem_or(val, "pan", 0.5) + by}))

        return stack(left,func(right))
    }

    // is there a different name for those in tidal?
    stack(...pats) {
      return stack(this, ...pats)
    }
    sequence(...pats) {
      return sequence(this, ...pats)
    }

    superimpose(...funcs) {
      return this.stack(...funcs.map((func) => func(this)));
    }

    edit(...funcs) {
      return stack(...funcs.map(func => func(this)));
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
Pattern.prototype.patternified = ['apply', 'fast', 'slow', 'early', 'late', 'duration', 'legato', 'velocity'];
// methods that create patterns, which are added to patternified Pattern methods
Pattern.prototype.factories = { pure, stack, slowcat, fastcat, cat, timeCat, sequence, polymeter, pm, polyrhythm, pr};
// the magic happens in Pattern constructor. Keeping this in prototype enables adding methods from the outside (e.g. see tonal.ts)

// Elemental patterns

// Nothing
const silence = new Pattern(_ => [])

function pure(value) {
    // A discrete value that repeats once per cycle
    function query(state) {
        return state.span.spanCycles.map(subspan => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value))
    }
    return new Pattern(query)
}

function steady(value) {
    // A continuous value
    return new Pattern(span => Hap(undefined, span, value))
}

export const signal = func => {
    const query = state => [new Hap(undefined, state.span, func(state.span.midpoint()))]
    return new Pattern(query)
}

const _toBipolar = pat => pat.fmap(x => (x * 2) - 1)
const _fromBipolar = pat => pat.fmap(x => (x + 1) / 2)

export const sine2   = signal(t => Math.sin(Math.PI * 2 * t))
export const sine    = _fromBipolar(sine2)

export const cosine2 = sine2._early(0.25)
export const cosine  = sine._early(0.25)

export const saw     = signal(t => t % 1)
export const saw2    = _toBipolar(saw)

export const isaw    = signal(t => 1 - (t % 1))
export const isaw2   = _toBipolar(isaw)

export const tri2    = fastcat(isaw2, saw2)
export const tri     = fastcat(isaw, saw)

export const square  = signal(t => Math.floor((t*2) % 2))
export const square2 = _toBipolar(square)

function reify(thing) {
    // Tunrs something into a pattern, unless it's already a pattern
    if (thing?.constructor?.name == "Pattern") {
        return thing
    }
    return pure(thing)
}

// Basic functions for combining patterns

function stack(...pats) {
    const reified = pats.map(pat => reify(pat))
    const query = state => flatten(reified.map(pat => pat.query(state)))
    return new Pattern(query)
}

function slowcat(...pats) {
    // Concatenation: combines a list of patterns, switching between them
    // successively, one per cycle.
    pats = pats.map(reify)
    const query = function(state) {
        const span = state.span
        const pat_n = Math.floor(span.begin) % pats.length; 
        const pat = pats[pat_n]
        if (!pat) {
          // pat_n can be negative, if the span is in the past..
          return [];
        }
        // A bit of maths to make sure that cycles from constituent patterns aren't skipped.
        // For example if three patterns are slowcat-ed, the fourth cycle of the result should 
        // be the second (rather than fourth) cycle from the first pattern.
        const offset = span.begin.floor().sub(span.begin.div(pats.length).floor())
        return pat.withEventTime(t => t.add(offset)).query(state.setSpan(span.withTime(t => t.sub(offset))))
    }
    return new Pattern(query)._splitQueries()
}

function slowcatPrime(...pats) {
    // Concatenation: combines a list of patterns, switching between them
    // successively, one per cycle. Unlike slowcat, this version will skip cycles.
    pats = pats.map(reify)
    const query = function(state) {
        const pat_n = Math.floor(state.span.begin) % pats.length
        const pat = pats[pat_n]
        return pat.query(state)
    }
    return new Pattern(query)._splitQueries()
}

function fastcat(...pats) {
    // Concatenation: as with slowcat, but squashes a cycle from each
    // pattern into one cycle
    return slowcat(...pats)._fast(pats.length)
}

function cat(...pats) {
    return fastcat(...pats)
}

function timeCat(...timepats) {
    // Like cat, but where each step has a temporal 'weight'
    const total = timepats.map(a => a[0]).reduce((a,b) => a.add(b), Fraction(0))
    let begin = Fraction(0)
    const pats = []
    for (const [time, pat] of timepats) {
        const end = begin.add(time)
        pats.push(reify(pat)._compressSpan(new TimeSpan(begin.div(total), end.div(total))))
        begin = end
    }
    return stack(...pats)
}

function _sequenceCount(x) {
    if(Array.isArray(x)) {
        if (x.length == 0) {
            return [silence,0]
        }
        if (x.length == 1) {
            return _sequenceCount(x[0])
        }
        return [fastcat(...x.map(a => _sequenceCount(a)[0])), x.length]
    }
    return [reify(x), 1]
}

function sequence(...xs) {
    return _sequenceCount(xs)[0]
}

function polymeter(steps=0, ...args) {
    const seqs = args.map(a => _sequenceCount(a))
    if (seqs.length == 0) {
        return silence
    }
    if (steps  == 0) {
        steps = seqs[0][1]
    }
    const pats = []
    for (const seq of seqs) {
        if (seq[1] == 0) {
            next
        }
        if (steps == seq[1]) {
            pats.push(seq[0])
        }
        else {
            pats.push(seq[0]._fast(Fraction(steps).div(Fraction(seq[1]))))
        }
    }
    return stack(pats)
}

// alias
function pm(args) {
    polymeter(args)
}

function polyrhythm(...xs) {
    const seqs = xs.map(a => sequence(a))

    if (seqs.length == 0) {
        return silence
    }
    return stack(...seqs)
}

// alias
function pr(args) {
    polyrhythm(args)
}

const fast  = curry((a, pat) => pat.fast(a))
const slow  = curry((a, pat) => pat.slow(a))
const early = curry((a, pat) => pat.early(a))
const late  = curry((a, pat) => pat.late(a))
const rev   = pat => pat.rev()
const add   = curry((a, pat) => pat.add(a))
const sub   = curry((a, pat) => pat.sub(a))
const mul   = curry((a, pat) => pat.mul(a))
const div   = curry((a, pat) => pat.div(a))
const union = curry((a, pat) => pat.union(a))
const every = curry((i, f, pat) => pat.every(i, f))
const when  = curry((binary, f, pat) => pat.when(binary, f))
const off   = curry((t, f, pat) => pat.off(t,f))
const jux   = curry((f, pat) => pat.jux(f))
const append = curry((a, pat) => pat.append(a))
const superimpose = curry((array, pat) => pat.superimpose(...array))
const struct = curry((a, pat) => pat.struct(a))
const mask   = curry((a, pat) => pat.mask(a))
const invert = pat => pat.invert()
const inv    = pat => pat.inv()

// problem: curried functions with spread arguments must have pat at the beginning
// with this, we cannot keep the pattern open at the end.. solution for now: use array to keep using pat as last arg

// these are the core composable functions. they are extended with Pattern.prototype.define below
Pattern.prototype.composable = { fast, slow, early, late, superimpose }

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

// this will add func as name to list of composable / patternified functions.
// those lists will be used in bootstrap to curry and compose everything, to support various call patterns
Pattern.prototype.define = (name, func, options = {}) => {
  if (options.composable) {
    Pattern.prototype.composable[name] = func;
  }
  if(options.patternified) {
    Pattern.prototype.patternified = Pattern.prototype.patternified.concat([name]);
  }
}

// Pattern.prototype.define('early', (a, pat) => pat.early(a), { patternified: true, composable: true });
Pattern.prototype.define('hush', (pat) => pat.hush(), { patternified: false, composable: true });
Pattern.prototype.define('bypass', (pat) => pat.bypass(on), { patternified: true, composable: true });

// call this after all Patter.prototype.define calls have been executed! (right before evaluate)
Pattern.prototype.bootstrap = () => {
  // makeComposable(Pattern.prototype);
  const bootstrapped = Object.fromEntries(Object.entries(Pattern.prototype.composable).map(([functionName, composable]) => {
    if(Pattern.prototype[functionName]) {
      // without this, 'C^7'.m.chordBass.transpose(2) will throw "C^7".m.chordBass.transpose is not a function
      Pattern.prototype[functionName] = makeComposable(Pattern.prototype[functionName]); // is this needed?
    }
    return [functionName, curry(composable, makeComposable)];
  }));
  return bootstrapped;
}

// this is wrapped around mini patterns to offset krill parser location into the global js code space
function withLocationOffset(pat, offset) {
  return pat._withContext((context) => {
    let locations = (context.locations || []);
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
    }});
    return {...context, locations }
  });
}

export {Fraction, TimeSpan, Hap, Pattern, 
    pure, stack, slowcat, fastcat, cat, timeCat, sequence, polymeter, pm, polyrhythm, pr, reify, silence,
    fast, slow, early, late, rev,
    add, sub, mul, div, union, every, when, off, jux, append, superimpose, 
    struct, mask, invert, inv,
    withLocationOffset
}

