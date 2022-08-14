/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import controls from '@strudel.cycles/core/controls.mjs';
import { evalScope, evaluate } from '@strudel.cycles/eval';
import { CodeMirror, cx, flash, useHighlighting, useRepl, useWebMidi } from '@strudel.cycles/react';
import { getDefaultSynth, cleanupDraw, cleanupUi, Tone } from '@strudel.cycles/tone';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './App.css';
import logo from './logo.svg';
import * as tunes from './tunes.mjs';
import { prebake } from './prebake.mjs';
import * as WebDirt from 'WebDirt';
import { loadWebDirt } from '@strudel.cycles/webdirt';
import { resetLoadedSamples, getAudioContext } from '@strudel.cycles/webaudio';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
);

evalScope(
  Tone,
  controls,
  { WebDirt },
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/webdirt'),
  import('@strudel.cycles/serial'),
  import('@strudel.cycles/soundfonts'),
);

loadWebDirt({
  sampleMapUrl: 'EmuSP12.json',
  sampleFolder: 'EmuSP12',
});

prebake();

async function initCode() {
  // load code from url hash (either short hash from database or decode long hash)
  try {
    const initialUrl = window.location.href;
    const hash = initialUrl.split('?')[1]?.split('#')?.[0];
    const codeParam = window.location.href.split('#')[1];
    // looking like https://strudel.tidalcycles.org/?J01s5i1J0200 (fixed hash length)
    if (codeParam) {
      console.log('decode hash from url');
      // looking like https://strudel.tidalcycles.org/#ImMzIGUzIg%3D%3D (hash length depends on code length)
      return atob(decodeURIComponent(codeParam || ''));
    } else if (hash) {
      return supabase
        .from('code')
        .select('code')
        .eq('hash', hash)
        .then(({ data, error }) => {
          if (error) {
            console.warn('failed to load hash', err);
          }
          if (data.length) {
            console.log('load hash from database', hash);
            return data[0].code;
          }
        });
    }
  } catch (err) {
    console.warn('failed to decode', err);
  }
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
  const [lastShared, setLastShared] = useState();
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
    hideHeader,
    hideConsole,
  } = useRepl({
    tune: '// LOADING...',
    defaultSynth,
  });
  useEffect(() => {
    initCode().then((decoded) => setCode(decoded || randomTune));
  }, []);
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
          e.preventDefault();
          flash(view);
          await activateCode();
        } else if (e.code === 'Period') {
          cycle.stop();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [pattern, code, activateCode, cycle, view]);

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
      {!hideHeader && (
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
            <button
              onClick={() => {
                getAudioContext().resume(); // fixes no sound in ios webkit
                togglePlay();
              }}
              className={cx('hover:bg-gray-300', !isEmbedded ? 'p-2' : 'px-2')}
            >
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
                  // console.log('tune', _code); // uncomment this to debug when random code fails
                  setCode(_code);
                  cleanupDraw();
                  cleanupUi();
                  resetLoadedSamples();
                  await prebake(); // declare default samples
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
            {!isEmbedded && (
              <button
                className={cx('cursor-pointer hover:bg-gray-300', !isEmbedded ? 'p-2' : 'px-2')}
                onClick={async () => {
                  const codeToShare = activeCode || code;
                  if (lastShared === codeToShare) {
                    // alert('Link already generated!');
                    pushLog(`Link already generated!`);
                    return;
                  }
                  // generate uuid in the browser
                  const hash = nanoid(12);
                  const { data, error } = await supabase.from('code').insert([{ code: codeToShare, hash }]);
                  if (!error) {
                    setLastShared(activeCode || code);
                    const shareUrl = window.location.origin + '?' + hash;
                    // copy shareUrl to clipboard
                    navigator.clipboard.writeText(shareUrl);
                    const message = `Link copied to clipboard: ${shareUrl}`;
                    // alert(message);
                    pushLog(message);
                  } else {
                    console.log('error', error);
                    const message = `Error: ${error.message}`;
                    // alert(message);
                    pushLog(message);
                  }
                }}
              >
                📣 share{lastShared && lastShared === (activeCode || code) ? 'd!' : ''}
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
      )}
      <section className="grow flex flex-col text-gray-100">
        <div className="grow relative flex overflow-auto pb-8 cursor-text" id="code">
          {/* onCursor={markParens} */}
          <CodeMirror value={code} onChange={setCode} onViewChanged={setView} />
          <span className="z-[20] bg-black rounded-t-md py-1 px-2 fixed bottom-0 right-1 text-xs whitespace-pre text-right pointer-events-none">
            {!cycle.started ? `press ctrl+enter to play\n` : dirty ? `ctrl+enter to update\n` : 'no changes\n'}
          </span>
          {error && (
            <div
              className={cx(
                'rounded-md fixed pointer-events-none left-2 bottom-1 text-xs bg-black px-2 z-[20]',
                'text-red-500',
              )}
            >
              {error?.message || 'unknown error'}
            </div>
          )}
        </div>
        {!isEmbedded && !hideConsole && (
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
