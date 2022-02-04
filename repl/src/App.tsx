import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import * as strudel from '../../strudel.mjs';
import cx from './cx';

const { Fraction, TimeSpan } = strudel;

const fr = (v: number) => new Fraction(v);
const ts = (start: number, end: number) => new TimeSpan(fr(start), fr(end));
const parse = (code: string): Pattern<any> => {
  const { sequence, stack, pure } = strudel; // make available to eval
  return eval(code);
};
function App() {
  const [code, setCode] = useState<string>("sequence('a', 'b', sequence('c', 'd'))");
  const [events, setEvents] = useState<Hap<any>[]>([]);
  const [error, setError] = useState<Error>();
  useEffect(() => {
    try {
      const pattern = parse(code);
      console.log('pattern', pattern);
      setEvents(pattern.query(ts(0, 1)));
      console.log('events', events);
      setError(undefined);
    } catch (err: any) {
      setError(err);
    }
  }, [code]);
  return (
    <div className="h-[100vh] bg-slate-900 flex-row">
      <header className="px-2 flex items-center space-x-2 border-b border-gray-200 bg-white">
        <img src={logo} className="Tidal-logo w-16 h-16" alt="logo" />
        <h1 className="text-2xl">Strudel REPL</h1>
      </header>
      <section className="grow p-2 text-gray-100">
        <div className="relative">
          <div className="absolute right-2 bottom-2 text-red-500">{error?.message}</div>
          <textarea
            className={cx('w-full h-32 bg-slate-600', error ? 'focus:ring-red-500' : 'focus:ring-slate-800')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <textarea className="w-full h-64 bg-slate-600" value={events.map((e) => e.show()).join('\n')} readOnly />
      </section>
    </div>
  );
}

export default App;

declare interface Fraction {
  (v: number): Fraction;
  d: number;
  n: number;
  s: number;
}
declare interface TimeSpan {
  constructor: any; //?
  begin: Fraction;
  end: Fraction;
}
declare interface Hap<T> {
  whole: TimeSpan;
  part: TimeSpan;
  value: T;
  show: () => string;
}
declare interface Pattern<T> {
  query: (span: TimeSpan) => Hap<T>[];
}
