import { Hap } from './hap.mjs';
import { Pattern, fastcat, reify, silence } from './pattern.mjs';
import Fraction from './fraction.mjs';
import { id } from './util.mjs';

export function steady(value) {
  // A continuous value
  return new Pattern((span) => Hap(undefined, span, value));
}

export const signal = (func) => {
  const query = (state) => [new Hap(undefined, state.span, func(state.span.midpoint()))];
  return new Pattern(query);
};

export const isaw = signal((t) => 1 - (t % 1));
export const isaw2 = isaw._toBipolar();

export const saw = signal((t) => t % 1);
export const saw2 = saw._toBipolar();

export const sine2 = signal((t) => Math.sin(Math.PI * 2 * t));
export const sine = sine2._fromBipolar();
export const cosine = sine._early(Fraction(1).div(4));
export const cosine2 = sine2._early(Fraction(1).div(4));

export const square = signal((t) => Math.floor((t * 2) % 2));
export const square2 = square._toBipolar();

export const tri = fastcat(isaw, saw);
export const tri2 = fastcat(isaw2, saw2);

export const time = signal(id);

// random signals

const xorwise = (x) => {
  const a = (x << 13) ^ x;
  const b = (a >> 17) ^ a;
  return (b << 5) ^ b;
};

// stretch 300 cycles over the range of [0,2**29 == 536870912) then apply the xorshift algorithm
const _frac = (x) => x - Math.trunc(x);

const timeToIntSeed = (x) => xorwise(Math.trunc(_frac(x / 300) * 536870912));

const intSeedToRand = (x) => (x % 536870912) / 536870912;

const timeToRand = (x) => intSeedToRand(timeToIntSeed(x));

const timeToRandsPrime = (seed, n) => {
  const result = [];
  for (let i = 0; i < n; ++n) {
    result.push(intSeedToRand(seed));
    seed = xorwise(seed);
  }
  return result;
};

const timeToRands = (t, n) => timeToRandsPrime(timeToIntSeed(t), n);

export const rand2 = signal(timeToRand);
export const rand = rand2.fmap(Math.abs);

export const _brandBy = (p) => rand.fmap((x) => x < p);
export const brandBy = (pPat) => reify(pPat).fmap(_brandBy).innerJoin();
export const brand = _brandBy(0.5);

export const _irand = (i) => rand.fmap((x) => Math.trunc(x * i));
export const irand = (ipat) => reify(ipat).fmap(_irand).innerJoin();

export const chooseWith = (pat, xs) => {
  if (xs.length == 0) {
    return silence;
  }
  return pat.range(0, xs.length).fmap((i) => xs[Math.floor(i)]);
};

export const choose = (...xs) => chooseWith(rand, xs);

export const perlinWith = (pat) => {
  const pata = pat.fmap(Math.floor);
  const patb = pat.fmap((t) => Math.floor(t) + 1);
  const smootherStep = (x) => 6.0 * x ** 5 - 15.0 * x ** 4 + 10.0 * x ** 3;
  const interp = (x) => (a) => (b) => a + smootherStep(x) * (b - a);
  return pat.sub(pata).fmap(interp).appBoth(pata.fmap(timeToRand)).appBoth(patb.fmap(timeToRand));
};

export const perlin = perlinWith(time);

Pattern.prototype._degradeByWith = function (withPat, x) {
  return this.fmap((a) => (_) => a).appLeft(withPat._filterValues((v) => v > x));
};

Pattern.prototype._degradeBy = function (x) {
  return this._degradeByWith(rand, x);
};

Pattern.prototype._degrade = function () {
  return this._degradeBy(0.5);
};

Pattern.prototype.patternified.push('degradeBy', 'degrade');
