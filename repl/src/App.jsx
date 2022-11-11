/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// import { evaluate } from '@strudel.cycles/eval';
import { CodeMirror, cx, flash, useHighlighting } from '@strudel.cycles/react';
// import { cleanupDraw, cleanupUi, Tone } from '@strudel.cycles/tone';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './App.css';
import logo from './logo.svg';
import * as tunes from './tunes.mjs';
import { prebake } from './prebake.mjs';
import * as WebDirt from 'WebDirt';
import { resetLoadedSamples, getAudioContext } from '@strudel.cycles/webaudio';
import { controls, evalScope, logger } from '@strudel.cycles/core';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { useStrudel } from '@strudel.cycles/react';
import { webaudioOutput, initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import StopCircleIcon from '@heroicons/react/20/solid/StopCircleIcon';
import CommandLineIcon from '@heroicons/react/20/solid/CommandLineIcon';
import SparklesIcon from '@heroicons/react/20/solid/SparklesIcon';
import LinkIcon from '@heroicons/react/20/solid/LinkIcon';
import AcademicCapIcon from '@heroicons/react/20/solid/AcademicCapIcon';

initAudioOnFirstClick();

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
);

evalScope(
  // Tone,
  controls, // sadly, this cannot be exported from core direclty
  { WebDirt },
  import('@strudel.cycles/core'),
  // import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/serial'),
  import('@strudel.cycles/soundfonts'),
);

prebake();

const hideHeader = false;
const pending = false;
const getTime = () => getAudioContext().currentTime;

async function initCode() {
  // load code from url hash (either short hash from database or decode long hash)
  try {
    const initialUrl = window.location.href;
    const hash = initialUrl.split('?')[1]?.split('#')?.[0];
    const codeParam = window.location.href.split('#')[1];
    // looking like https://strudel.tidalcycles.org/?J01s5i1J0200 (fixed hash length)
    if (codeParam) {
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
  const allTunes = Object.entries(tunes);
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [name, code] = randomItem(allTunes);
  return { name, code };
}

const { code: randomTune, name } = getRandomTune();
const isEmbedded = window.location !== window.parent.location;
function App() {
  // const [editor, setEditor] = useState();
  const [view, setView] = useState();
  const [lastShared, setLastShared] = useState();

  // logger
  const [log, setLog] = useState([]);
  const pushLog = (message, type) => {
    setLog((l) => {
      logger(message);
      const lastLog = l.length ? l[l.length - 1] : undefined;
      const index = (lastLog?.index ?? -1) + 1;
      if (lastLog && lastLog.message === message) {
        l = l.slice(0, -1).concat([{ message, type, count: (lastLog.count ?? 1) + 1, index }]);
      } else {
        l = l.concat([{ message, type, index }]);
      }
      return l.slice(-20);
    });
  };
  const logBox = useRef();
  useLayoutEffect(() => {
    if (logBox.current) {
      // scroll log box to bottom when log changes
      logBox.current.scrollTop = logBox.current?.scrollHeight;
    }
  }, [log]);

  // repl
  const { code, setCode, scheduler, evaluate, activateCode, error, isDirty, activeCode, pattern, started, stop } =
    useStrudel({
      initialCode: '// LOADING',
      defaultOutput: webaudioOutput,
      getTime,
      autolink: true,
      onLog: pushLog,
    });

  // init code
  useEffect(() => {
    initCode().then((decoded) => {
      pushLog(
        `🌀 Welcome to Strudel! ${
          decoded ? `I have loaded the code from the URL.` : `A random code snippet named "${name}" has been loaded!`
        } Press play or hit ctrl+enter to run it!`,
        'highlight',
      );
      setCode(decoded || randomTune);
    });
  }, []);

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
          stop();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [activateCode, stop, view]);

  useHighlighting({
    view,
    pattern,
    active: started && !activeCode?.includes('strudel disable-highlighting'),
    getTime: () => scheduler.getPhase(),
    // getTime: () => Tone.getTransport().seconds,
  });

  return (
    // bg-gradient-to-t from-blue-900 to-slate-900
    <div className="h-screen flex flex-col">
      {!hideHeader && (
        <header
          id="header"
          className={cx(
            'flex-none w-full md:flex text-black justify-between z-[100] text-lg bg-header select-none sticky top-0',
            isEmbedded ? 'h-12 md:h-8' : 'h-25 md:h-14',
          )}
        >
          <div className="px-2 flex items-center space-x-2 pt-2 md:pt-0 pointer-events-none">
            <img
              src={logo}
              className={cx('Tidal-logo', isEmbedded ? 'w-8 h-8' : 'w-10 h-10')} // 'bg-[#ffffff80] rounded-full'
              alt="logo"
            />
            <h1
              className={cx(
                isEmbedded ? 'text-l' : 'text-xl',
                // 'bg-clip-text bg-gradient-to-r from-primary to-secondary  text-transparent font-bold',
                'text-white font-bold',
              )}
            >
              strudel <span className="text-sm">REPL</span>
            </h1>
          </div>
          <div className="flex max-w-full overflow-auto text-white ">
            <button
              onClick={async () => {
                await getAudioContext().resume(); // fixes no sound in ios webkit
                if (!started) {
                  activateCode();
                } else {
                  stop();
                }
              }}
              className={cx(!isEmbedded ? 'p-2' : 'px-2')}
            >
              {!pending ? (
                <span className={cx('flex items-center space-x-1 hover:text-primary', isEmbedded ? 'w-16' : 'w-16')}>
                  {started ? <StopCircleIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
                  <span>{started ? 'stop' : 'play'}</span>
                </span>
              ) : (
                <>loading...</>
              )}
            </button>
            <button
              onClick={() => {
                isDirty && activateCode();
                pushLog('Code updated! Tip: You can also update the code by pressing ctrl+enter.');
              }}
              className={cx(
                'flex items-center space-x-1',
                !isEmbedded ? 'p-2' : 'px-2',
                !isDirty || !activeCode ? 'opacity-50' : 'hover:text-primary',
              )}
            >
              <CommandLineIcon className="w-5 h-5" />
              <span>update</span>
            </button>
            {!isEmbedded && (
              <button
                className="hover:text-primary p-2 flex items-center space-x-1"
                onClick={async () => {
                  const { code, name } = getRandomTune();
                  pushLog(`✨ loading random tune "${name}"`);
                  /*
                  cleanupDraw();
                  cleanupUi(); */
                  resetLoadedSamples();
                  await prebake(); // declare default samples
                  await evaluate(code, false);
                }}
              >
                <SparklesIcon className="w-5 h-5" />
                <span> shuffle</span>
                {/*  <MusicalNoteIcon /> <RadioIcon/>  */}
              </button>
            )}
            {!isEmbedded && (
              <a
                href="./tutorial"
                className={cx('hover:text-primary flex items-center space-x-1', !isEmbedded ? 'p-2' : 'px-2')}
              >
                <AcademicCapIcon className="w-5 h-5" />
                <span>learn</span>
              </a>
            )}
            {!isEmbedded && (
              <button
                className={cx(
                  'cursor-pointer hover:text-primary flex items-center space-x-1',
                  !isEmbedded ? 'p-2' : 'px-2',
                )}
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
                <LinkIcon className="w-5 h-5" />
                <span>share{lastShared && lastShared === (activeCode || code) ? 'd!' : ''}</span>
                {/* GlobaAlt Megaphone PaperAirplane Share */}
              </button>
            )}
            {isEmbedded && (
              <button className={cx('hover:text-primary px-2')}>
                <a href={window.location.href} target="_blank" rel="noopener noreferrer" title="Open in REPL">
                  🚀 open
                </a>
              </button>
            )}
            {isEmbedded && (
              <button className={cx('hover:text-primary px-2')}>
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
      <section className="grow flex text-gray-100 relative overflow-auto cursor-text pb-4" id="code">
        <CodeMirror
          value={code}
          onChange={(c) => {
            setCode(c);
            started && pushLog('[edit] code changed. hit ctrl+enter to update');
          }}
          onViewChanged={setView}
        />
      </section>
      <footer className="bg-footer">
        {/*         {error && (
          <div
            className={cx(
              'rounded-md pointer-events-none left-0 p-1 text-sm bg-black px-2 z-[20] max-w-screen break-all',
              'text-red-500',
            )}
          >
            {error?.message || 'unknown error'}
          </div>
        )} */}
        <div
          ref={logBox}
          className="text-white font-mono text-sm h-32 flex-none overflow-auto max-w-full break-all p-4"
        >
          {log.map((l, i) => (
            <div
              key={l.index}
              className={cx(l.type === 'error' && 'text-red-500', l.type === 'highlight' && 'text-highlight')}
            >
              &gt; {l.message}
              {l.count ? ` (${l.count})` : ''}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;

function ActionButton({ children, onClick, className }) {
  return (
    <button
      className={cx(
        'bg-lineblack py-1 px-2 bottom-0 text-md whitespace-pre text-right pb-2 cursor-pointer flex items-center space-x-1 hover:text-primary',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function FloatingBottomMenu() {
  {
    /*         <span className="hidden md:block z-[20] bg-black py-1 px-2 text-sm absolute bottom-1 right-0 text-md whitespace-pre text-right pointer-events-none pb-2">
          {!started
            ? `press ctrl+enter to play\n`
            : isDirty
            ? `press ctrl+enter to update\n`
            : 'press ctrl+dot do stop\n'}
          </span>*/
  }
  return (
    <div className="flex justify-center w-full absolute bottom-0 z-[20]">
      <ActionButton
        onClick={async () => {
          await getAudioContext().resume(); // fixes no sound in ios webkit
          if (!started) {
            activateCode();
          } else {
            stop();
          }
        }}
      >
        {!pending ? (
          <span className={cx('flex items-center space-x-1 hover:text-primary', isEmbedded ? 'w-16' : 'w-16')}>
            {started ? <StopCircleIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
            <span>{started ? 'stop' : 'play'}</span>
          </span>
        ) : (
          <>loading...</>
        )}
      </ActionButton>
      <ActionButton
        onClick={() => {
          isDirty && activateCode();
        }}
        className={cx(!isDirty || !activeCode ? 'opacity-50 hover:text-inherit' : 'hover:text-primary')}
      >
        <CommandLineIcon className="w-5 h-5" />
        <span>update</span>
      </ActionButton>
    </div>
  );
}
