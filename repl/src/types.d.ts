export declare interface Fraction {
  (v: number): Fraction;
  d: number;
  n: number;
  s: number;
  sub: (f: Fraction) => Fraction;
  sam: () => Fraction;
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
  show: () => string;
}
export declare interface Pattern<T = any> {
  query: (span: TimeSpan) => Hap<T>[];
}
