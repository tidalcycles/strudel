import { Hap } from './hap.mjs';
import { Pattern, fastcat } from './pattern.mjs';
import Fraction from './fraction.mjs';

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
