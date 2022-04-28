/*
fraction.mjs - <short description TODO>
Copyright (C) 2022 <author(s) TODO> and contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import Fraction from 'fraction.js';
import { TimeSpan } from './timespan.mjs';

// Returns the start of the cycle.
Fraction.prototype.sam = function () {
  return this.floor();
};

// Returns the start of the next cycle.
Fraction.prototype.nextSam = function () {
  return this.sam().add(1);
};

// Returns a TimeSpan representing the begin and end of the Time value's cycle
Fraction.prototype.wholeCycle = function () {
  return new TimeSpan(this.sam(), this.nextSam());
};

// The position of a time value relative to the start of its cycle.
Fraction.prototype.cyclePos = function () {
  return this.sub(this.sam());
};

Fraction.prototype.lt = function (other) {
  return this.compare(other) < 0;
};

Fraction.prototype.gt = function (other) {
  return this.compare(other) > 0;
};

Fraction.prototype.lte = function (other) {
  return this.compare(other) <= 0;
};

Fraction.prototype.gte = function (other) {
  return this.compare(other) >= 0;
};

Fraction.prototype.eq = function (other) {
  return this.compare(other) == 0;
};

Fraction.prototype.max = function (other) {
  return this.gt(other) ? this : other;
};

Fraction.prototype.min = function (other) {
  return this.lt(other) ? this : other;
};

Fraction.prototype.show = function () {
  return this.s * this.n + '/' + this.d;
};

Fraction.prototype.or = function (other) {
  return this.eq(0) ? other : this;
};

const fraction = (n) => {
  if (typeof n === 'number') {
    /*
    https://github.com/infusion/Fraction.js/#doubles
    „If you pass a double as it is, Fraction.js will perform a number analysis based on Farey Sequences."
    „If you want to keep the number as it is, convert it to a string, as the string parser will not perform any further observations“
    
    -> those farey sequences turn out to make pattern querying ~20 times slower! always use strings!
    -> still, some optimizations could be done: .mul .div .add .sub calls still use numbers
    */
    n = String(n);
  }
  return Fraction(n);
};

export const gcd = (...fractions) => {
  return fractions.reduce((gcd, fraction) => gcd.gcd(fraction), fraction(1));
};

fraction._original = Fraction;

export default fraction;

// "If you concern performance, cache Fraction.js objects and pass arrays/objects.“
// -> tested memoized version, but it's slower than unmemoized, even with repeated evaluation
/* const memo = {};
const memoizedFraction = (n) => {
  if (typeof n === 'number') {
    n = String(n);
  }
  if (memo[n] !== undefined) {
    return memo[n];
  }
  memo[n] = Fraction(n);
  return memo[n];
}; */
