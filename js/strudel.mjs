import Fraction from 'fraction.js'

var removeUndefineds = function(xs) {
    // Removes 'None' values from given list
    return xs.filter(x => x != undefined)
}

function flatten(arr) {
    return [].concat(...arr)
}

var id = a => a

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

Fraction.prototype.max = function(other) {
    return this.gt(other) ? this : other
}

Fraction.prototype.min = function(other) {
    return this.lt(other) ? this : other
}

Fraction.prototype.show = function () {
    return  this.n + "/" + this.d
}

class TimeSpan {
    constructor(begin, end) {
        this.begin = Fraction(begin)
        this.end = Fraction(end)
    }

    get spanCycles() {
        var spans = []
        var begin = this.begin
        var end = this.end
        var end_sam = end.sam()

        while (end.gt(begin)) {
            // If begin and end are in the same cycle, we're done.
            if (begin.sam().equals(end_sam)) {
                spans.push(new TimeSpan(begin, this.end))
                break
            }
            // add a timespan up to the next sam
            var next_begin = begin.nextSam()
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

    intersection(other) {
        // Intersection of two timespans, returns None if they don't intersect.
        var intersect_begin = this.begin.max(other.begin)
        var intersect_end = this.end.min(other.end)

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
        var result = this.intersection(other)
        if (result == undefined) {
            // TODO - raise exception
            // raise ValueError(f'TimeSpan {self} and TimeSpan {other} do not intersect')
        }
        return result
    }

    get midpoint() {
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
    */

    constructor(whole, part, value) {
        this.whole = whole
        this.part = part
        this.value = value
    }

    withSpan(func) {
        // Returns a new event with the function f applies to the event timespan.
        var whole = this.whole ? func(this.whole) : undefined
        return new Hap(whole, func(this.part), this.value)
    }

    withValue(func) {
        // Returns a new event with the function f applies to the event value.
        return new Hap(this.whole, this.part, func(this.value))
    }

    hasOnset() {
        // Test whether the event contains the onset, i.e that
        // the beginning of the part is the same as that of the whole timespan."""
        return (this.whole != undefined) && (this.whole.begin.equals(this.part.begin))
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
}

class Pattern {
    constructor(query) {
        this.query = query
    }

    _splitQueries() {
        // Splits queries at cycle boundaries. This makes some calculations 
        // easier to express, as all events are then constrained to happen within 
        // a cycle.
        var pat = this
        var q = function(span) {
            return flatten(span.spanCycles.map(subspan => pat.query(subspan)))
        }
        return new Pattern(q)
    }


    withQuerySpan(func) {
        return new Pattern(span => this.query(func(span)))
    }

    withQueryTime(func) {
        // Returns a new pattern, with the function applied to both the begin
        // and end of the the query timespan
        return new Pattern(span => this.query(span.withTime(func)))
    }

    withEventSpan(func) {
        // Returns a new pattern, with the function applied to each event
        // timespan.
        return new Pattern(span => this.query(span).map(hap => hap.withSpan(func)))
    }

    withEventTime(func) {
        // Returns a new pattern, with the function applied to both the begin
        // and end of each event timespan. 
        return this.withEventSpan(span => span.withTime(func))
    }

    withValue(func) {
        // Returns a new pattern, with the function applied to the value of
        // each event. It has the alias 'fmap'.
        return new Pattern(span => this.query(span).map(hap => hap.withValue(func)))
    }

    // alias
    fmap(func) {
        return this.withValue(func)
    }

    _filterEvents(event_test) {
        return new Pattern(span => this.query(span).filter(event_test))
    }

    _filterValues(value_test) {
         return new Pattern(span => this.query(span).filter(hap => value_test(hap.value)))
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
        var pat_func = this
        query = function(span) {
            var event_funcs = pat_func.query(span)
            var event_vals = pat_val.query(span)
            apply = function(event_func, event_val) {
                var s = event_func.part.intersection(event_val.part)
                if (s == undefined) {
                    return undefined
                }
                return new Hap(whole_func(event_func.whole, event_val.whole), s, event_func.value(event_val.value))
            }
            return flatten(event_funcs.map(event_func => removeUndefineds(event_vals.map(event_val => apply(event_func, event_val)))))
        }
        return new Pattern(query)
        }

    appBoth(pat_val) {
        // Tidal's <*>
        var whole_func = function(span_a, span_b) {
            if (span_a == undefined || span_B == undefined) {
                return undefined
            }
            return span_a.intersection_e(span_b)
        }
        return this._appWhole(whole_func, pat_val)
    }

    appLeft(pat_val) {
        var pat_func = this

        var query = function(span) {
            var haps = []
            for (var hap_func of pat_func.query(span)) {
                var event_vals = pat_val.query(hap_func.part)
                for (var hap_val of event_vals) {
                    var new_whole = hap_func.whole
                    var new_part = hap_func.part.intersection_e(hap_val.part)
                    var new_value = hap_func.value(hap_val.value)
                    var hap = new Hap(new_whole, new_part, new_value)
                    haps.push(hap)
                }
            }
            return haps
        }
        return new Pattern(query)
    }

    appRight(pat_val) {
        var pat_func = this

        var query = function(span) {
            var haps = []
            for (var hap_val of pat_val.query(span)) {
                var hap_funcs = pat_func.query(hap_val.part)
                for (var hap_func of hap_funcs) {
                    var new_whole = hap_val.whole
                    var new_part = hap_func.part.intersection_e(hap_val.part)
                    var new_value = hap_func.value(hap_val.value)
                    var hap = new Hap(new_whole, new_part, new_value)
                    haps.push(hap)
                }
            }
            return haps
        }
        return new Pattern(query)
    }

    get firstCycle() {
        return this.query(new TimeSpan(Fraction(0), Fraction(1)))
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
    
    union(other) {
        return this._opleft(other, a => b => Object.assign({}, a, b))
    }
    
    _bindWhole(choose_whole, func) {
        var pat_val = this
        var query = function(span) {
            var withWhole = function(a, b) {
                return new Hap(choose_whole(a.whole, b.whole), b.part,
                               b.value
                             )
            }
            var match = function (a) {
                return func(a.value).query(a.part).map(b => withWhole(a, b))
            }
            return flatten(pat_val.query(span).map(match))
        }
        return new Pattern(query)
    }

    bind(func) {
        var whole_func = function(a, b) {
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

//     def _patternify(method):
//         def patterned(self, *args):
//             pat_arg = sequence(*args)
//             return pat_arg.fmap(lambda arg: method(self,arg)).outer_join()
//         return patterned

    _fast(factor) {
        var fastQuery = this.withQueryTime(t => t.mul(factor))
        return fastQuery.withEventTime(t => t.div(factor))
    }
//     fast = _patternify(_fast)

    _slow(factor) {
        return this._fast(1/factor)
    }
//     slow = _patternify(_slow)

    _early(offset) {
        // Equivalent of Tidal's <~ operator
        offset = Fraction(offset)
        return this.withQueryTime(t => t.add(offset)).withEventTime(t => t.sub(offset))
    }
//     early = _patternify(_early)

    _late(offset) {
        // Equivalent of Tidal's ~> operator
        return this._early(0-offset)
    }
//    late = _patternify(_late)

    when(binary_pat, func) {
        //binary_pat = sequence(binary_pat)
        var true_pat = binary_pat._filterValues(id)
        var false_pat = binary_pat._filterValues(val => !val)
        var with_pat = true_pat.fmap(_ => y => y).appRight(func(this))
        var without_pat = false_pat.fmap(_ => y => y).appRight(this)
        return stack([with_pat, without_pat])
    }

    off(time_pat, func) {
        return stack([this, func(this._early(time_pat))])
    }

    off(time_pat, func) {
        return stack(this, func(this.early(time_pat)))
    }

    every(n, func) {
        pats = Array(n-1).fill(this)
        pats.unshift(this)
        return slowcat(pats)
    }

    append(other) {
        return fastcat([this, other])
    }

    rev() {
        var pat = this
        var query = function(span) {
            var cycle = span.begin.sam()
            var next_cycle = span.begin.nextSam()
            var reflect = function(to_reflect) {
                var reflected = to_reflect.withTime(time => cycle.add(next_cycle.sub(time)))
                // [reflected.begin, reflected.end] = [reflected.end, reflected.begin] -- didn't work
                var tmp = reflected.begin
                reflected.begin = reflected.end
                reflected.end = tmp
                return reflected
            }
            var haps = pat.query(reflect(span))
            return haps.map(hap => hap.withSpan(reflect))
        }
        return new Pattern(query)._splitQueries()
    }

    jux(func, by=1) {
        by /= 2
        var elem_or = function(dict, key, dflt) {
            if (key in dict) {
                return dict[key]
            }
            return dflt
        }
        var left = this.withValue(val => Object.assign({}, val, {pan: elem_or(val, "pan", 0.5) - by}))
        var right = this.withValue(val => Object.assign({}, val, {pan: elem_or(val, "pan", 0.5) + by}))

        return stack([left,func(right)])
    }

//     def first_cycle(self):
//         return self.query(TimeSpan(Fraction(0), Fraction(1)))

//     def __repr__(self):
//         return str(self.first_cycle())
}

function reify(thing) {
    if (thing.constructor.name == "Pattern") {
        return thing
    }
    return pure(thing)
}

function pure(value) {
    // Returns a pattern that repeats the given value once per cycle
    function query(span) {
        return span.spanCycles.map(subspan => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value))
    }
    return new Pattern(query)
}

function stack(pats) {
    var pats = pats.map(reify)
    var query = function(span) {
        return flatten(pats.map(pat => pat.query(span)))
    }
    return new Pattern(query)
}

function slowcat(pats) {
    // Concatenation: combines a list of patterns, switching between them
    // successively, one per cycle.
    // (currently behaves slightly differently from Tidal)
    //var pats = pats.map(reify)
    var query = function(span) {
        var pat = pats[Math.floor(span.begin) % pats.length]
        return pat.query(span)
    }
    return new Pattern(query)._splitQueries()
}

function fastcat(pats) {
    // Concatenation: as with slowcat, but squashes a cycle from each
    // pattern into one cycle
    return slowcat(pats)._fast(pats.length)
}

function cat(pats) {
    return fastcat(pats)
}

export {Fraction, TimeSpan, Hap, Pattern, pure, stack, slowcat, fastcat, cat}

