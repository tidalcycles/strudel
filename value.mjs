import { curry } from 'ramda';

function unionWithObj(a, b, func) {
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
