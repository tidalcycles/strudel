import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import cx from './cx';
import * as Tone from 'tone';
import useCycle from './useCycle';
import type { Pattern } from './types';
import * as tunes from './tunes';
import { evaluate } from './evaluate';
import CodeMirror from './CodeMirror';
import hot from '../public/hot';
import { isNote } from 'tone';
import { useWebMidi } from './midi';

const [_, codeParam] = window.location.href.split('#');
const decoded = atob(codeParam || '');

const getHotCode = async () => {
  return fetch('/hot.js')
    .then((res) => res.text())
    .then((src) => {
      return src.split('export default').slice(-1)[0].trim();
    });
};

const defaultSynth = new Tone.PolySynth().chain(new Tone.Gain(0.5), Tone.Destination);
defaultSynth.set({
  oscillator: { type: 'triangle' },
  envelope: {
    release: 0.01,
  },
});

function getRandomTune() {
  const allTunes = Object.values(tunes);
  const randomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  return randomItem(allTunes);
}

const randomTune = getRandomTune();

function App() {
  const [mode, setMode] = useState<string>('javascript');
  const [code, setCode] = useState<string>(decoded || randomTune);
  const [log, setLog] = useState('');
  const logBox = useRef<any>();
  const [error, setError] = useState<Error>();
  const [pattern, setPattern] = useState<Pattern>();
  const [activePattern, setActivePattern] = useState<Pattern>();
  const activatePattern = (_pattern = pattern) => {
    setActivePattern(() => _pattern);
    window.location.hash = '#' + btoa(code);
    !cycle.started && cycle.start();
  };
  const [isHot, setIsHot] = useState(false); // set to true to enable live coding in hot.js, using dev server
  const pushLog = (message: string) => setLog((log) => log + `${log ? '\n\n' : ''}${message}`);
  // logs events of cycle
  const logCycle = (_events: any, cycle: any) => {
    if (_events.length) {
      pushLog(`# cycle ${cycle}\n` + _events.map((e: any) => e.show()).join('\n'));
    }
  };
  // cycle hook to control scheduling
  const cycle = useCycle({
    onEvent: useCallback((time, event) => {
      try {
        if (!event.value?.onTrigger) {
          const note = event.value?.value || event.value;
          if (!isNote(note)) {
            throw new Error('not a note: ' + note);
          }
          defaultSynth.triggerAttackRelease(note, event.duration, time);
          /* console.warn('no instrument chosen', event);
          throw new Error(`no instrument chosen for ${JSON.stringify(event)}`); */
        } else {
          const { onTrigger } = event.value;
          onTrigger(time, event);
        }
      } catch (err: any) {
        console.warn(err);
        err.message = 'unplayable event: ' + err?.message;
        pushLog(err.message); // not with setError, because then we would have to setError(undefined) on next playable event
      }
    }, []),
    onQuery: useCallback(
      (span) => {
        try {
          return activePattern?.query(span) || [];
        } catch (err: any) {
          setError(err);
          return [];
        }
      },
      [activePattern]
    ),
    onSchedule: useCallback((_events, cycle) => logCycle(_events, cycle), [activePattern]),
    ready: !!activePattern,
  });

  // set active pattern on ctrl+enter
  useLayoutEffect(() => {
    const handleKeyPress = (e: any) => {
      if (e.ctrlKey || e.altKey) {
        switch (e.code) {
          case 'Enter':
            activatePattern();
            break;
          case 'Period':
            cycle.stop();
        }
      }
    };
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [pattern]);

  // parse pattern when code changes
  useEffect(() => {
    let _code = code;
    // handle hot mode
    if (isHot) {
      if (typeof hot !== 'string') {
        getHotCode().then((_code) => {
          setCode(_code);
          setMode('javascript');
        }); // if using HMR, just use changed file
        activatePattern(hot);
        return;
      } else {
        _code = hot;
        setCode(_code);
      }
    }
    // normal mode
    try {
      const parsed = evaluate(_code);
      // need arrow function here! otherwise if user returns a function, react will think it's a state reducer
      // only first time, then need ctrl+enter
      setPattern(() => parsed.pattern);
      if (isHot) {
        activatePattern(parsed.pattern);
      }
      setMode(parsed.mode);
      setError(undefined);
    } catch (err: any) {
      console.warn(err);
      setError(err);
    }
  }, [code, isHot]);

  // scroll log box to bottom when log changes
  useLayoutEffect(() => {
    logBox.current.scrollTop = logBox.current?.scrollHeight;
  }, [log]);

  useWebMidi({
    ready: useCallback(({ outputs }) => {
      pushLog(`WebMidi ready! Just add .midi(${outputs.map((o) => `"${o.name}"`).join(' | ')}) to the pattern. `);
    }, []),
    connected: useCallback(({ outputs }) => {
      pushLog(`Midi device connected! Available: ${outputs.map((o) => `"${o.name}"`).join(', ')}`);
    }, []),
    disconnected: useCallback(({ outputs }) => {
      pushLog(`Midi device disconnected! Available: ${outputs.map((o) => `"${o.name}"`).join(', ')}`);
    }, []),
  });

  return (
    <div className="min-h-screen bg-[#2A3236] flex flex-col">
      <header className="flex-none w-full h-16 px-2 flex border-b border-gray-200 bg-white justify-between">
        <div className="flex items-center space-x-2">
          <img src={logo} className="Tidal-logo w-16 h-16" alt="logo" />
          <h1 className="text-2xl">Strudel REPL</h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              const _code = getRandomTune();
              console.log('tune',_code); // uncomment this to debug when random code fails
              setCode(_code);
              const parsed = evaluate(_code);
              // Tone.Transport.cancel(Tone.Transport.seconds);
              setActivePattern(parsed.pattern);
            }}
          >
            🎲 random tune
          </button>
          {window.location.href.includes('http://localhost:8080') && (
            <button
              onClick={() => {
                if (isHot || confirm('Really switch? You might loose your current pattern..')) {
                  setIsHot((h) => !h);
                }
              }}
            >
              🔥 toggle hot mode
            </button>
          )}
        </div>
      </header>
      <section className="grow flex flex-col text-gray-100">
        <div className="grow relative">
          <div className={cx('h-full  bg-[#2A3236]', error ? 'focus:ring-red-500' : 'focus:ring-slate-800')}>
            <CodeMirror
              value={code}
              readOnly={isHot}
              options={{
                mode,
                theme: 'material',
                lineNumbers: true,
              }}
              onChange={(_: any, __: any, value: any) => {
                if (!isHot) {
                  // setLog((log) => log + `${log ? '\n\n' : ''}✏️ edit\n${code}\n${value}`);
                  setCode(value);
                }
              }}
            />
            <span className="p-4 absolute top-0 right-0 text-xs whitespace-pre text-right">
              {!cycle.started
                ? `press ctrl+enter to play\n`
                : !isHot && activePattern !== pattern
                ? `ctrl+enter to update\n`
                : 'no changes\n'}
              {!isHot && <>{{ pegjs: 'mini' }[mode] || mode} mode</>}
              {isHot && '🔥 hot mode: go to hot.js to edit pattern, then save'}
            </span>
          </div>
          {error && <div className="absolute right-2 bottom-2 text-red-500">{error?.message || 'unknown error'}</div>}
        </div>
        <button
          className="flex-none w-full border border-gray-700 p-2 bg-slate-700 hover:bg-slate-500"
          onClick={() => {
            if (!cycle.started) {
              activatePattern();
            } else {
              cycle.stop();
            }
          }}
        >
          {cycle.started ? 'pause' : 'play'}
        </button>
        <textarea
          className="grow bg-[#283237] border-0 text-xs min-h-[200px]"
          value={log}
          readOnly
          ref={logBox}
          style={{ fontFamily: 'monospace' }}
        />
      </section>
    </div>
  );
}

export default App;
