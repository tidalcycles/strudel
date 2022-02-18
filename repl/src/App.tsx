import React, { useCallback, useLayoutEffect, useRef } from 'react';
import * as Tone from 'tone';
import CodeMirror from './CodeMirror';
import cx from './cx';
import { evaluate } from './evaluate';
import logo from './logo.svg';
import { useWebMidi } from './midi';
import * as tunes from './tunes';
import useRepl from './useRepl';

// TODO: use https://www.npmjs.com/package/@monaco-editor/react

const [_, codeParam] = window.location.href.split('#');
let decoded;
try {
  decoded = atob(decodeURIComponent(codeParam || ''));
} catch (err) {
  console.warn('failed to decode', err);
}

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
  const { setCode, setPattern, error, code, cycle, dirty, log, togglePlay, activateCode, pattern, pushLog } = useRepl({
    tune: decoded || randomTune,
    defaultSynth,
  });
  const logBox = useRef<any>();
  // scroll log box to bottom when log changes
  useLayoutEffect(() => {
    logBox.current.scrollTop = logBox.current?.scrollHeight;
  }, [log]);

  // set active pattern on ctrl+enter
  useLayoutEffect(() => {
    // TODO: make sure this is only fired when editor has focus
    const handleKeyPress = (e: any) => {
      if (e.ctrlKey || e.altKey) {
        switch (e.code) {
          case 'Enter':
            activateCode();
            !cycle.started && cycle.start();
            break;
          case 'Period':
            cycle.stop();
        }
      }
    };
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [pattern, code]);

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
              console.log('tune', _code); // uncomment this to debug when random code fails
              setCode(_code);
              const parsed = evaluate(_code);
              // Tone.Transport.cancel(Tone.Transport.seconds);
              setPattern(parsed.pattern);
            }}
          >
            🎲 random tune
          </button>
          <button>
            <a href="./tutorial">📚 tutorial</a>
          </button>
        </div>
      </header>
      <section className="grow flex flex-col text-gray-100">
        <div className="grow relative">
          <div className={cx('h-full  bg-[#2A3236]', error ? 'focus:ring-red-500' : 'focus:ring-slate-800')}>
            <CodeMirror
              value={code}
              options={{
                mode: 'javascript',
                theme: 'material',
                lineNumbers: true,
              }}
              onChange={(_: any, __: any, value: any) => setCode(value)}
            />
            <span className="p-4 absolute top-0 right-0 text-xs whitespace-pre text-right">
              {!cycle.started ? `press ctrl+enter to play\n` : dirty ? `ctrl+enter to update\n` : 'no changes\n'}
            </span>
          </div>
          {error && (
            <div className={cx('absolute right-2 bottom-2', 'text-red-500')}>{error?.message || 'unknown error'}</div>
          )}
        </div>
        <button
          className="flex-none w-full border border-gray-700 p-2 bg-slate-700 hover:bg-slate-500"
          onClick={() => togglePlay()}
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
