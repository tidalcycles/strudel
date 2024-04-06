/*
value.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/value.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { curry } from './util.mjs';
import { logger } from './logger.mjs';

export function unionWithObj(a, b, func) {
  if (b?.value !== undefined && Object.keys(b).length === 1) {
    // https://github.com/tidalcycles/strudel/issues/1026
    logger(`[warn]: Can't do arithmetic on control pattern.`);
    return a;
  }
  const common = Object.keys(a).filter((k) => Object.keys(b).includes(k));
  return Object.assign({}, a, b, Object.fromEntries(common.map((k) => [k, func(a[k], b[k])])));
}

export const mul = curry((a, b) => a * b);

export const valued = (value) => {
  if (value?.constructor?.name === 'Value') {
    return value;
  }
  return Value.of(value);
};

export class Value {
  constructor(value) {
    this.value = value;
  }
  static of(x) {
    return new Value(x);
  }
  get isNothing() {
    return this.value === null || this.value === undefined;
  }
  map(f) {
    if (this.isNothing) {
      return this;
    }
    return Value.of(f(this.value));
  }
  mul(n) {
    return this.map(mul).ap(n);
  }
  ap(other) {
    return valued(other).map(this.value);
  }
  unionWith(other, func) {
    const type = typeof this.value;
    other = valued(other);
    if (type !== typeof other.value) {
      throw new Error('unionWith: both Values must have same type!');
    }
    if (Array.isArray(type) || type !== 'object') {
      throw new Error('unionWith: expected objects');
    }
    return this.map((v) => unionWithObj(v, other.value, func));
  }
}

export const map = curry((f, anyFunctor) => anyFunctor.map(f));
