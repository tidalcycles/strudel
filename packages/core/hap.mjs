/*
hap.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/hap.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import Fraction from './fraction.mjs';

export class Hap {
  /*
      Event class, representing a value active during the timespan
      'part'. This might be a fragment of an event, in which case the
      timespan will be smaller than the 'whole' timespan, otherwise the
      two timespans will be the same. The 'part' must never extend outside of the
      'whole'. If the event represents a continuously changing value
      then the whole will be returned as None, in which case the given
      value will have been sampled from the point halfway between the
      start and end of the 'part' timespan.
      The context is to store a list of source code locations causing the event.

      The word 'Event' is more or less a reserved word in javascript, hence this
      class is named called 'Hap'.
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
    let duration;
    if (typeof this.value?.duration === 'number') {
      duration = Fraction(this.value.duration);
    } else {
      duration = this.whole.end.sub(this.whole.begin);
    }
    if (typeof this.value?.clip === 'number') {
      return duration.mul(this.value.clip);
    }
    return duration;
  }

  get endClipped() {
    return this.whole.begin.add(this.duration);
  }

  isActive(currentTime) {
    return this.whole.begin <= currentTime && this.endClipped >= currentTime;
  }

  isInPast(currentTime) {
    return currentTime > this.endClipped;
  }
  isInNearPast(margin, currentTime) {
    return currentTime - margin <= this.endClipped;
  }

  isInFuture(currentTime) {
    return currentTime < this.whole.begin;
  }
  isInNearFuture(margin, currentTime) {
    return currentTime < this.whole.begin && currentTime > this.whole.begin - margin;
  }
  isWithinTime(min, max) {
    return this.whole.begin <= max && this.endClipped >= min;
  }

  wholeOrPart() {
    return this.whole ? this.whole : this.part;
  }

  withSpan(func) {
    // Returns a new hap with the function f applies to the hap timespan.
    const whole = this.whole ? func(this.whole) : undefined;
    return new Hap(whole, func(this.part), this.value, this.context);
  }

  withValue(func) {
    // Returns a new hap with the function f applies to the hap value.
    return new Hap(this.whole, this.part, func(this.value), this.context);
  }

  hasOnset() {
    // Test whether the hap contains the onset, i.e that
    // the beginning of the part is the same as that of the whole timespan."""
    return this.whole != undefined && this.whole.begin.equals(this.part.begin);
  }

  hasTag(tag) {
    return this.context.tags?.includes(tag);
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

  show(compact = false) {
    const value =
      typeof this.value === 'object'
        ? compact
          ? JSON.stringify(this.value).slice(1, -1).replaceAll('"', '').replaceAll(',', ' ')
          : JSON.stringify(this.value)
        : this.value;
    var spans = '';
    if (this.whole == undefined) {
      spans = '~' + this.part.show;
    } else {
      var is_whole = this.whole.begin.equals(this.part.begin) && this.whole.end.equals(this.part.end);
      if (!this.whole.begin.equals(this.part.begin)) {
        spans = this.whole.begin.show() + ' ⇜ ';
      }
      if (!is_whole) {
        spans += '(';
      }
      spans += this.part.show();
      if (!is_whole) {
        spans += ')';
      }
      if (!this.whole.end.equals(this.part.end)) {
        spans += ' ⇝ ' + this.whole.end.show();
      }
    }
    return '[ ' + spans + ' | ' + value + ' ]';
  }

  showWhole(compact = false) {
    return `${this.whole == undefined ? '~' : this.whole.show()}: ${
      typeof this.value === 'object'
        ? compact
          ? JSON.stringify(this.value).slice(1, -1).replaceAll('"', '').replaceAll(',', ' ')
          : JSON.stringify(this.value)
        : this.value
    }`;
  }

  combineContext(b) {
    const a = this;
    return { ...a.context, ...b.context, locations: (a.context.locations || []).concat(b.context.locations || []) };
  }

  setContext(context) {
    return new Hap(this.whole, this.part, this.value, context);
  }

  ensureObjectValue() {
    /* if (isNote(hap.value)) {
      // supports primitive hap values that look like notes
      hap.value = { note: hap.value };
    } */
    if (typeof this.value !== 'object') {
      throw new Error(
        `expected hap.value to be an object, but got "${this.value}". Hint: append .note() or .s() to the end`,
        'error',
      );
    }
  }
}

export default Hap;
