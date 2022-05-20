/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import controls from '@strudel.cycles/core/controls.mjs';
import { evalScope, evaluate } from '@strudel.cycles/eval';
import { CodeMirror, cx, useHighlighting, useRepl, useWebMidi } from '@strudel.cycles/react';
import { getDefaultSynth, cleanupDraw, cleanupUi, Tone } from '@strudel.cycles/tone';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import './App.css';
import logo from './logo.svg';
import * as tunes from './tunes.mjs';
evalScope(
  Tone,
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
);

const initialUrl = window.location.href;
const codeParam = window.location.href.split('#')[1];
let decoded;
try {
  decoded = atob(decodeURIComponent(codeParam || ''));
} catch (err) {
  console.warn('failed to decode', err);
}

function getRandomTune() {
  const allTunes = Object.values(tunes);
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return randomItem(allTunes);
}

const randomTune = getRandomTune();
const defaultSynth = getDefaultSynth();
const isEmbedded = window.location !== window.parent.location;
function App() {
  // const [editor, setEditor] = useState();
  const [view, setView] = useState();
  const {
    setCode,
    setPattern,
    error,
    code,
    cycle,
    dirty,
    log,
    togglePlay,
    activeCode,
    setActiveCode,
    activateCode,
    pattern,
    pushLog,
    pending,
  } = useRepl({
    tune: decoded || randomTune,
    defaultSynth,
  });
  const logBox = useRef();
  // scroll log box to bottom when log changes
  useLayoutEffect(() => {
    if (logBox.current) {
      logBox.current.scrollTop = logBox.current?.scrollHeight;
    }
  }, [log]);

  // set active pattern on ctrl+enter
  useLayoutEffect(() => {
    // TODO: make sure this is only fired when editor has focus
    const handleKeyPress = async (e) => {
      if (e.ctrlKey || e.altKey) {
        if (e.code === 'Enter') {
          await activateCode();
          e.preventDefault();
        } else if (e.code === 'Period') {
          cycle.stop();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pattern, code, activateCode, cycle]);

  useHighlighting({ view, pattern, active: cycle.started && !activeCode?.includes('strudel disable-highlighting') });

  useWebMidi({
    ready: useCallback(
      ({ outputs }) => {
        pushLog(`WebMidi ready! Just add .midi(${outputs.map((o) => `'${o.name}'`).join(' | ')}) to the pattern. `);
      },
      [pushLog],
    ),
    connected: useCallback(
      ({ outputs }) => {
        pushLog(`Midi device connected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`);
      },
      [pushLog],
    ),
    disconnected: useCallback(
      ({ outputs }) => {
        pushLog(`Midi device disconnected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`);
      },
      [pushLog],
    ),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header
        id="header"
        className={cx(
          'flex-none w-full px-2 flex border-b border-gray-200  justify-between z-[10] bg-gray-100',
          isEmbedded ? 'h-8' : 'h-14',
        )}
      >
        <div className="flex items-center space-x-2">
          <img src={logo} className={cx('Tidal-logo', isEmbedded ? 'w-6 h-6' : 'w-10 h-10')} alt="logo" />
          <h1 className={isEmbedded ? 'text-l' : 'text-xl'}>Strudel {isEmbedded ? 'Mini ' : ''}REPL</h1>
        </div>
        <div className="flex">
          <button onClick={() => togglePlay()} className={cx('hover:bg-gray-300', !isEmbedded ? 'p-2' : 'px-2')}>
            {!pending ? (
              <span className={cx('flex items-center', isEmbedded ? 'w-16' : 'w-16')}>
                {cycle.started ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {cycle.started ? 'pause' : 'play'}
              </span>
            ) : (
              <>loading...</>
            )}
          </button>
          {!isEmbedded && (
            <button
              className="hover:bg-gray-300 p-2"
              onClick={async () => {
                const _code = getRandomTune();
                console.log('tune', _code); // uncomment this to debug when random code fails
                setCode(_code);
                cleanupDraw();
                cleanupUi();
                const parsed = await evaluate(_code);
                setPattern(parsed.pattern);
                setActiveCode(_code);
              }}
            >
              🎲 random
            </button>
          )}
          {!isEmbedded && (
            <button className={cx('hover:bg-gray-300', !isEmbedded ? 'p-2' : 'px-2')}>
              <a href="./tutorial">📚 tutorial</a>
            </button>
          )}
          {isEmbedded && (
            <button className={cx('hover:bg-gray-300 px-2')}>
              <a href={window.location.href} target="_blank" rel="noopener noreferrer" title="Open in REPL">
                🚀 open
              </a>
            </button>
          )}
          {isEmbedded && (
            <button className={cx('hover:bg-gray-300 px-2')}>
              <a
                onClick={() => {
                  window.location.href = initialUrl;
                  window.location.reload();
                }}
                title="Reset"
              >
                💔 reset
              </a>
            </button>
          )}
        </div>
      </header>
      <section className="grow flex flex-col text-gray-100">
        <div className="grow relative flex overflow-auto" id="code">
          {/* onCursor={markParens} */}
          <CodeMirror value={code} onChange={setCode} onViewChanged={setView} />
          <span className="z-[20] py-1 px-2 absolute top-0 right-0 text-xs whitespace-pre text-right pointer-events-none">
            {!cycle.started ? `press ctrl+enter to play\n` : dirty ? `ctrl+enter to update\n` : 'no changes\n'}
          </span>
          {error && (
            <div className={cx('absolute right-2 bottom-2 px-2', 'text-red-500')}>
              {error?.message || 'unknown error'}
            </div>
          )}
        </div>
        {!isEmbedded && (
          <textarea
            className="z-[10] h-16 border-0 text-xs bg-[transparent] border-t border-slate-600 resize-none"
            value={log}
            readOnly
            ref={logBox}
            style={{ fontFamily: 'monospace' }}
          />
        )}
      </section>
      {/* !isEmbedded && (
        <button className="fixed right-4 bottom-2 z-[11]" onClick={() => playStatic(code)}>
          static
        </button>
      ) */}
    </div>
  );
}

export default App;
