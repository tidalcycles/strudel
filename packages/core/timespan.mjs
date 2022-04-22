import Fraction from './fraction.mjs';

export class TimeSpan {
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

  get duration() {
    return this.end.sub(this.begin);
  }

  cycleArc() {
    // Shifts a timespan to one of equal duration that starts within cycle zero.
    // (Note that the output timespan probably does not start *at* Time 0 --
    // that only happens when the input Arc starts at an integral Time.)
    const b = this.begin.cyclePos();
    const e = b.add(this.end.sub(this.begin));
    return new TimeSpan(b, e);
  }

  withTime(func_time) {
    // Applies given function to both the begin and end time of the timespan"""
    return new TimeSpan(func_time(this.begin), func_time(this.end));
  }

  withEnd(func_time) {
    // Applies given function to the end time of the timespan"""
    return new TimeSpan(this.begin, func_time(this.end));
  }

  withCycle(func_time) {
    // Like withTime, but time is relative to relative to the cycle (i.e. the
    // sam of the start of the timespan)
    const sam = this.begin.sam();
    const b = sam.add(func_time(this.begin.sub(sam)));
    const e = sam.add(func_time(this.end.sub(sam)));
    return new TimeSpan(b, e);
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
      throw 'TimeSpans do not intersect';
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

export default TimeSpan;
