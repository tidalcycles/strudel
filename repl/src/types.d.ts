import type { State } from '../../strudel.mjs';

export declare interface Fraction {
  (v: number): Fraction;
  d: number;
  n: number;
  s: number;
  sub: (f: Fraction) => Fraction;
  sam: () => Fraction;
  equals: (f: Fraction) => boolean;
}
export declare interface TimeSpan {
  constructor: any; //?
  begin: Fraction;
  end: Fraction;
}
export declare interface Hap<T = any> {
  whole: TimeSpan;
  part: TimeSpan;
  value: T;
  context: any;
  show: () => string;
}
export declare interface Pattern<T = any> {
  query: (span: State) => Hap<T>[];
  fmap: (v: T) => T;
}
