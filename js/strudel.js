import Fraction from 'fraction.js'

Fraction.prototype.sam = function() {
    return Fraction(Math.floor(this))
}

Fraction.prototype.lt = function(other) {
    return this.compare(other) < 0
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
            if (begin.sam() == end_sam) {
                spans.push(new TimeSpan(begin, this.end))
                break
            }
            // add a timespan up to the next sam
            var next_begin = begin.next_sam()
            spans.push(TimeSpan(begin, next_begin))

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
        if (result == None) {
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

class Event {

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

    with_span(func) {
        // Returns a new event with the function f applies to the event timespan.
        var whole = this.whole ? func(self.whole) : undefined
        return new Event(whole, func(this.part), this.value)
    }

    with_value(func) {
        // Returns a new event with the function f applies to the event value.
        return new Event(this.whole, this.part, func(this.value))
    }

    has_onset() {
        // Test whether the event contains the onset, i.e that
        // the beginning of the part is the same as that of the whole timespan."""
        return (this.whole != undefined) && (this.whole.begin == this.part.begin)
    }
}

window.bar = function() {
    console.log("aha" + typeof(Fraction(3.5)));
}

//console.log((new TimeSpan(3.5,4)).midpoint);

var ts = new TimeSpan(0,4)
console.log((new Event(new TimeSpan(0,2), new TimeSpan(0,2), "aha")).has_onset());
var x = new TimeSpan(0,4)
console.log(ts.equals(x))
