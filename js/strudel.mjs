import Fraction from 'fraction.js'

var removeUndefineds = function(xs) {
    // Removes 'None' values from given list
    return xs.filter(x => x != undefined)
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
        intersect_begin = Math.max(this.begin, other.begin)
        intersect_end = Math.min(this.end, other.end)

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
        result = this.intersection(other)
        if (result.equals(None)) {
            // TODO - raise exception
            // raise ValueError(f'TimeSpan {self} and TimeSpan {other} do not intersect')
        }
        return(result)
    }

    get midpoint() {
        return(this.begin.add((this.end.sub(this.begin)).div(Fraction(2))))
    }

    equals(other) {
        return this.begin.equals(other.begin) && this.end.equals(other.end)
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
        var whole = this.whole ? func(self.whole) : undefined
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
        return((this.whole === undefined && other.whole === undefined)
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
}

class Pattern {
    constructor(query) {
        this.query = query
    }

    splitQueries() {
        // Splits queries at cycle boundaries. This makes some calculations 
        // easier to express, as all events are then constrained to happen within 
        // a cycle.
        var query = function(span) {
            return span.spanCycles.map(subspan => this.query(subspan)).concat
        }
        return new Pattern(query)
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
        return new Pattern(this.query(span).map(hap => hap.withValue(func)))
    }

    // alias
    fmap(func) {
        this.withValue(func)
    }

    _filterEvents(event_test) {
        return new Pattern(span => this.query(span).filter(event_test))
    }

    _filterValues(self, value_test) {
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
        pat_func = this
        query = function(span) {
            event_funcs = pat_func.query(span)
            event_vals = pat_val.query(span)
            apply = function(event_func, event_val) {
                s = event_func.part.intersection(event_val.part)
                if (s === undefined) {
                    return undefined
                }
                return new Hap(whole_func(event_func.whole, event_val.whole), s, event_func.value(event_val.value))
            }
            return event_funcs.map(event_func => removeUndefineds(event_vals.map(event_val => apply(event_func, event_val)))).concat    
        }
        return new Pattern(query)
        }

    appBoth(self, pat_val) {
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
        pat_func = this
        var query = function(span) {
            events = []
            for (event_func in pat_func.query(span)) {
                event_vals = pat_val.query(event_func.part)
                for (event_val in event_vals) {
                    new_whole = event_func.whole
                    new_part = event_func.part.intersection_e(event_val.part)
                    new_value = event_func.value(event_val.value)
                    events.push(new Event(new_whole, new_part, new_value))
                }
            }
            return events
        }
        return Pattern(query)
    }

    appRight(pat_val) {
        pat_func = this
        var query = function(span) {
            events = []
            for (event_val in pat_val.query(span)) {
                event_funcs = pat_func.query(event_val.part)
                for (event_func in event_funcs) {
                    new_whole = event_val.whole
                    new_part = event_func.part.intersection_e(event_val.part)
                    new_value = event_func.value(event_val.value)
                    events.push(new Event(new_whole, new_part, new_value))
                }
            }
            return events
        }
        return new Pattern(query)
    }

//     def __add__(self, other):
//         return self.fmap(lambda x: lambda y: x + y).app_left(reify(other))

//     def __radd__(self, other):
//         return self.__add__(other)
    
//     def __sub__(self, other):
//         return self.fmap(lambda x: lambda y: x - y).app_left(reify(other))

//     def __rsub__(self, other):
//         raise ValueError # or return NotImplemented?

//     def union(self, other):
//         return self.fmap(lambda x: lambda y: {**x, **y}).app_left(other)

//     def __rshift__(self, other):
//         """Overrides the >> operator to support combining patterns of
//         dictionaries (AKA 'control patterns'). Produces the union of
//         two patterns of dictionaries, with values from right replacing
//         any with the same name from the left
//         """
//         return self.union(other)

//     def __lshift__(self, other):
//         """Like >>, but matching values from left replace those on the right"""
//         return self.fmap(lambda x: lambda y: {**y, **x}).app_left(other)
    
//     def _bind_whole(self, choose_whole, func):
//         pat_val = self
//         def query(span):
//             def withWhole(a, b):
//                 return Event(choose_whole(a.whole, b.whole), b.part,
//                              b.value
//                             )
//             def match(a):
//                 return [withWhole(a, b) for b in func(a.value).query(a.part)]

//             return concat([match(ev) for ev in pat_val.query(span)])
//         return Pattern(query)

//     def bind(self, func):
//         def whole_func(a, b):
//             if a == None or b == None:
//                 return None
//             return a.intersection_e(b)
//         return self._bind_whole(whole_func, func)

//     def join(self):
//         """Flattens a pattern of patterns into a pattern, where wholes are
//         the intersection of matched inner and outer events."""
//         return self.bind(id)

//     def inner_bind(self, func):
//         def whole_func(a, b):
//             return a
//         return self._bind_whole(whole_func, func)

//     def inner_join(self):
//         """Flattens a pattern of patterns into a pattern, where wholes are
//         taken from inner events."""
//         return self.inner_bind(id)
    
//     def outer_bind(self, func):
//         def whole_func(a, b):
//             return b
//         return self._bind_whole(whole_func, func)

//     def outer_join(self):
//         """Flattens a pattern of patterns into a pattern, where wholes are
//         taken from outer events."""
//         return self.outer_bind(id)

//     def _patternify(method):
//         def patterned(self, *args):
//             pat_arg = sequence(*args)
//             return pat_arg.fmap(lambda arg: method(self,arg)).outer_join()
//         return patterned

//     def _fast(self, factor):
//         """ Speeds up a pattern by the given factor"""
//         fastQuery = self.with_query_time(lambda t: t*factor)
//         fastEvents = fastQuery.with_event_time(lambda t: t/factor)
//         return fastEvents
//     fast = _patternify(_fast)

//     def _slow(self, factor):
//         """ Slow slows down a pattern """
//         return self._fast(1/factor)
//     slow = _patternify(_slow)

//     def _early(self, offset):
//         """ Equivalent of Tidal's <~ operator """
//         offset = Fraction(offset)
//         return self.with_query_time(lambda t: t+offset).with_event_time(lambda t: t-offset)
//     early = _patternify(_early)

//     def _late(self, offset):
//         """ Equivalent of Tidal's ~> operator """
//         return self._early(0-offset)
//     late = _patternify(_late)

//     def when(self, binary_pat, func):
//         binary_pat = sequence(binary_pat)
//         true_pat = binary_pat._filter_values(id)
//         false_pat = binary_pat._filter_values(lambda val: not val)
//         with_pat = true_pat.fmap(lambda _: lambda y: y).app_right(func(self))
//         without_pat = false_pat.fmap(lambda _: lambda y: y).app_right(self)
//         return stack(with_pat, without_pat)

//     def off(self, time_pat, func):
//         return stack(self, self.early(time_pat))

//     def every(self, n, func):
//         pats = [func(self)] + ([self] * (n-1))
//         return slowcat(*pats)
    
//     def append(self, other):
//         return fastcat(self,other)

//     def rev(self):
//         def query(span):
//             cycle = span.begin.sam()
//             next_cycle = span.begin.next_sam()
//             def reflect(to_reflect):
//                 reflected = to_reflect.with_time(lambda time: cycle + (next_cycle - time))
//                 (reflected.begin, reflected.end) = (reflected.end, reflected.begin)
//                 return reflected
//             events = self.query(reflect(span))
//             return [event.with_span(reflect) for event in events]
//         return Pattern(query).split_queries()

//     def jux(self, func, by=1):
//         by = by / 2
//         def elem_or(dict, key, default):
//             if key in dict:
//                 return dict[key]
//             return default
        
//         left  = self.with_value(lambda val: dict(list(val.items()) + [("pan", elem_or(val, "pan", 0.5) - by)]))
//         right = self.with_value(lambda val: dict(list(val.items()) + [("pan", elem_or(val, "pan", 0.5) + by)]))

//         return stack(left,func(right))

//     def first_cycle(self):
//         return self.query(TimeSpan(Fraction(0), Fraction(1)))

//     def __repr__(self):
//         return str(self.first_cycle())
}

function pure(value) {
    // Returns a pattern that repeats the given value once per cycle
    function query(span) {
        return span.spanCycles.map(subspan => new Hap(Fraction(subspan.begin).wholeCycle(), subspan, value))
    }
    return new Pattern(query)
}

export {TimeSpan, Hap, Pattern, pure, Fraction}

