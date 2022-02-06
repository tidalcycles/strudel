import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import logo from './logo.svg';
import * as strudel from '../../strudel.mjs';
import cx from './cx';
import * as Tone from 'tone';
import useCycle from './useCycle';
import type { Hap, Pattern } from './types';
import { tetris } from './tunes';
import _mini from './mini';

const { sequence, pure, reify, slowcat, fastcat, cat, stack, silence } = strudel; // make available to eval
const mini = _mini; // for eval (direct import wont work somehow)
const parse = (code: string): Pattern => eval(code);

const synth = new Tone.PolySynth().toDestination();
synth.set({
  oscillator: { type: 'triangle' },
  envelope: {
    release: 0.01,
  },
});

function App() {
  const [code, setCode] = useState<string>(tetris);
  const [log, setLog] = useState('');
  const logBox = useRef<any>();
  const [error, setError] = useState<Error>();
  const [pattern, setPattern] = useState<Pattern>();
  // logs events of cycle
  const logCycle = (_events: any, cycle: any) => {
    if (_events.length) {
      setLog((log) => log + `${log ? '\n\n' : ''}# cycle ${cycle}\n` + _events.map((e: any) => e.show()).join('\n'));
    }
  };
  // cycle hook to control scheduling
  const cycle = useCycle({
    onEvent: useCallback((time, event) => {
      // console.log('event', event, time);
      synth.triggerAttackRelease(event.value, event.duration, time);
    }, []),
    onQuery: useCallback(
      (span) => {
        try {
          return pattern?.query(span) || [];
        } catch (err: any) {
          setError(err);
          return [];
        }
      },
      [pattern]
    ),
    onSchedule: useCallback(
      (_events, cycle) => {
        // console.log('schedule', _events, cycle);
        logCycle(_events, cycle);
      },
      [pattern]
    ),
    ready: !!pattern,
  });
  // parse pattern when code changes
  useEffect(() => {
    try {
      const _pattern = parse(code);
      setPattern(_pattern);
      // cycle.query(cycle.activeCycle()); // reschedule active cycle
      setError(undefined);
    } catch (err: any) {
      setError(err);
    }
  }, [code]);
  // scroll log box to bottom when log changes
  useLayoutEffect(() => {
    logBox.current.scrollTop = logBox.current?.scrollHeight;
  }, [log]);

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
            className={cx('w-full h-64 bg-slate-600', error ? 'focus:ring-red-500' : 'focus:ring-slate-800')}
            value={code}
            onChange={(e) => {
              setLog((log) => log + `${log ? '\n\n' : ''}✏️ edit\n${code}\n${e.target.value}`);
              setCode(e.target.value);
            }}
          />
        </div>
        <textarea
          className="w-full h-64 bg-slate-600"
          value={log}
          readOnly
          ref={logBox}
          style={{ fontFamily: 'monospace' }}
        />
        <button
          className="w-full border border-gray-700 p-2 bg-slate-700 hover:bg-slate-500"
          onClick={() => cycle.toggle()}
        >
          {cycle.started ? 'pause' : 'play'}
        </button>
      </section>
    </div>
  );
}

export default App;
