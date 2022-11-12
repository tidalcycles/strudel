/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// import { evaluate } from '@strudel.cycles/eval';
import { CodeMirror, cx, flash, useHighlighting } from '@strudel.cycles/react';
// import { cleanupDraw, cleanupUi, Tone } from '@strudel.cycles/tone';
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import logo from './logo.svg';
import * as tunes from './tunes.mjs';
import { prebake } from './prebake.mjs';
import * as WebDirt from 'WebDirt';
import { resetLoadedSamples, getAudioContext, getLoadedSamples } from '@strudel.cycles/webaudio';
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
import XMarkIcon from '@heroicons/react/20/solid/XMarkIcon';
import AcademicCapIcon from '@heroicons/react/20/solid/AcademicCapIcon';

initAudioOnFirstClick();

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
);

const modules = [
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
];

evalScope(
  // Tone,
  controls, // sadly, this cannot be exported from core direclty
  { WebDirt },
  ...modules,
);

let loadedSamples = [];
const presets = prebake();

Promise.all([...modules, presets]).then((data) => {
  // console.log('modules and sample registry loade', data);
  loadedSamples = Object.entries(getLoadedSamples() || {});
});

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
  const [view, setView] = useState(); // codemirror view
  const [lastShared, setLastShared] = useState();
  const [activeFooter, setActiveFooter] = useState('console');

  // logger
  const [log, setLog] = useState([]);
  useLogger(
    useCallback((e) => {
      const { message, type, data } = e.detail;
      setLog((l) => {
        const lastLog = l.length ? l[l.length - 1] : undefined;
        const id = nanoid(12);
        // if (type === 'loaded-sample' && lastLog.type === 'load-sample' && lastLog.url === data.url) {
        if (type === 'loaded-sample') {
          // const loadIndex = l.length - 1;
          const loadIndex = l.findIndex(({ data: { url }, type }) => type === 'load-sample' && url === data.url);
          l[loadIndex] = { message, type, id, data };
        } else if (lastLog && lastLog.message === message) {
          l = l.slice(0, -1).concat([{ message, type, count: (lastLog.count ?? 1) + 1, id, data }]);
        } else {
          l = l.concat([{ message, type, id, data }]);
        }
        return l.slice(-20);
      });
    }, []),
  );
  const footerContent = useRef();
  useLayoutEffect(() => {
    if (footerContent.current && activeFooter === 'console') {
      // scroll log box to bottom when log changes
      footerContent.current.scrollTop = footerContent.current?.scrollHeight;
    }
  }, [log, activeFooter]);
  useLayoutEffect(() => {
    if (activeFooter === 'console') {
      footerContent.current.scrollTop = footerContent.current?.scrollHeight;
    } else {
      footerContent.current.scrollTop = 0;
    }
  }, [activeFooter]);

  const { code, setCode, scheduler, evaluate, activateCode, error, isDirty, activeCode, pattern, started, stop } =
    useStrudel({
      initialCode: '// LOADING',
      defaultOutput: webaudioOutput,
      getTime,
      autolink: true,
      onEvalError: () => {
        setActiveFooter('console');
      },
    });

  // init code
  useEffect(() => {
    initCode().then((decoded) => {
      if (!decoded) {
        setActiveFooter('intro');
      }
      logger(
        `Welcome to Strudel! ${
          decoded ? `I have loaded the code from the URL.` : `A random code snippet named "${name}" has been loaded!`
        } Press play or hit ctrl+enter to run it!`,
        'highlight',
      );
      setCode(decoded || randomTune);
    });
  }, []);

  useKeydown(
    useCallback(
      async (e) => {
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
      },
      [activateCode, stop, view],
    ),
  );

  useHighlighting({
    view,
    pattern,
    active: started && !activeCode?.includes('strudel disable-highlighting'),
    getTime: () => scheduler.getPhase(),
  });

  //
  // UI Actions
  //

  const handleTogglePlay = async () => {
    await getAudioContext().resume(); // fixes no sound in ios webkit
    if (!started) {
      logger('[repl] started. tip: you can also start by pressing ctrl+enter', 'highlight');
      activateCode();
    } else {
      logger('[repl] stopped. tip: you can also stop by pressing ctrl+dot', 'highlight');
      stop();
    }
  };
  const handleUpdate = () => {
    isDirty && activateCode();
    logger('[repl] code updated! tip: you can also update the code by pressing ctrl+enter', 'highlight');
  };

  const handleShuffle = async () => {
    const { code, name } = getRandomTune();
    logger(`[repl] ✨ loading random tune "${name}"`);
    /*
    cleanupDraw();
    cleanupUi(); */
    resetLoadedSamples();
    await prebake(); // declare default samples
    await evaluate(code, false);
  };

  const handleShare = async () => {
    const codeToShare = activeCode || code;
    if (lastShared === codeToShare) {
      logger(`Link already generated!`, 'error');
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
      alert(message);
      // alert(message);
      logger(message, 'highlight');
    } else {
      console.log('error', error);
      const message = `Error: ${error.message}`;
      // alert(message);
      logger(message);
    }
  };

  const handleChangeCode = (c) => {
    setCode(c);
    started && logger('[edit] code changed. hit ctrl+enter to update');
  };

  const FooterTab = ({ children, name, label }) => (
    <>
      <div
        onClick={() => setActiveFooter(name)}
        className={cx(
          'h-8 px-2 text-white cursor-pointer hover:text-tertiary flex items-center space-x-1 border-b',
          activeFooter === name ? 'border-white hover:border-tertiary' : 'border-transparent',
        )}
      >
        {label || name}
      </div>
      {activeFooter === name && <>{children}</>}
    </>
  );

  return (
    // bg-gradient-to-t from-blue-900 to-slate-900
    // bg-gradient-to-t from-green-900 to-slate-900
    <div
      className={cx(
        'h-screen flex flex-col',
        //        'bg-gradient-to-t from-green-900 to-slate-900', //
      )}
    >
      {!hideHeader && (
        <header
          id="header"
          className={cx(
            'flex-none w-full md:flex text-black justify-between z-[100] text-lg bg-header select-none sticky top-0',
            isEmbedded ? 'h-12 md:h-8' : 'h-25 md:h-14',
          )}
        >
          <div className="px-4 flex items-center space-x-2 pt-2 md:pt-0 pointer-events-none">
            {/*             <img
              src={logo}
              className={cx('Tidal-logo', isEmbedded ? 'w-8 h-8' : 'w-10 h-10', started && 'animate-pulse')} // 'bg-[#ffffff80] rounded-full'
              alt="logo"
            /> */}
            <h1
              className={cx(
                isEmbedded ? 'text-l' : 'text-xl',
                // 'bg-clip-text bg-gradient-to-r from-primary to-secondary  text-transparent font-bold',
                'text-white font-bold flex space-x-2',
              )}
            >
              <div className={cx('mt-[1px]', started && 'animate-spin')}>🌀</div>
              <div className={cx(started && 'animate-pulse')}>
                <span className="">strudel</span> <span className="text-sm">REPL</span>
              </div>
            </h1>
          </div>
          <div className="flex max-w-full overflow-auto text-white ">
            <button
              onClick={handleTogglePlay}
              className={cx(!isEmbedded ? 'p-2' : 'px-2', 'hover:text-tertiary', !started && 'animate-pulse')}
            >
              {!pending ? (
                <span className={cx('flex items-center space-x-1', isEmbedded ? 'w-16' : 'w-16')}>
                  {started ? <StopCircleIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
                  <span>{started ? 'stop' : 'play'}</span>
                </span>
              ) : (
                <>loading...</>
              )}
            </button>
            <button
              onClick={handleUpdate}
              className={cx(
                'flex items-center space-x-1',
                !isEmbedded ? 'p-2' : 'px-2',
                !isDirty || !activeCode ? 'opacity-50' : 'hover:text-tertiary',
              )}
            >
              <CommandLineIcon className="w-5 h-5" />
              <span>update</span>
            </button>
            {!isEmbedded && (
              <button className="hover:text-tertiary p-2 flex items-center space-x-1" onClick={handleShuffle}>
                <SparklesIcon className="w-5 h-5" />
                <span> shuffle</span>
              </button>
            )}
            {!isEmbedded && (
              <a
                href="./tutorial"
                className={cx('hover:text-tertiary flex items-center space-x-1', !isEmbedded ? 'p-2' : 'px-2')}
              >
                <AcademicCapIcon className="w-5 h-5" />
                <span>learn</span>
              </a>
            )}
            {!isEmbedded && (
              <button
                className={cx(
                  'cursor-pointer hover:text-tertiary flex items-center space-x-1',
                  !isEmbedded ? 'p-2' : 'px-2',
                )}
                onClick={handleShare}
              >
                <LinkIcon className="w-5 h-5" />
                <span>share{lastShared && lastShared === (activeCode || code) ? 'd!' : ''}</span>
              </button>
            )}
            {isEmbedded && (
              <button className={cx('hover:text-tertiary px-2')}>
                <a href={window.location.href} target="_blank" rel="noopener noreferrer" title="Open in REPL">
                  🚀 open
                </a>
              </button>
            )}
            {isEmbedded && (
              <button className={cx('hover:text-tertiary px-2')}>
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
      <section className="grow flex text-gray-100 relative overflow-auto cursor-text pb-0" id="code">
        <CodeMirror value={code} onChange={handleChangeCode} onViewChanged={setView} />
      </section>
      <footer className="bg-footer">
        <div className="flex justify-between px-2">
          <div className="flex pb-2 select-none">
            <FooterTab name="intro" />
            <FooterTab name="samples" />
            <FooterTab name="console" label={`console (${log.length})`} />
          </div>
          {activeFooter !== '' && (
            <button onClick={() => setActiveFooter('')} className="text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        {activeFooter !== '' && (
          <div
            className="text-white font-mono text-sm h-72 max-h-[33vh] flex-none overflow-auto max-w-full px-4"
            ref={footerContent}
          >
            {activeFooter === 'intro' && (
              <div className="prose prose-invert max-w-[600px] pt-2 font-sans pb-8">
                <h3>
                  <span className={cx('animate-spin inline-block select-none')}>🌀</span> welcome
                </h3>
                <p>
                  You have found <span className="underline">strudel</span>, a new live coding platform to write dynamic
                  music pieces in the browser! It is free and open-source and made for beginners and experts alike. To
                  get started:
                  <br />
                  <br />
                  <span className="underline">1. hit play</span> -{' '}
                  <span className="underline">2. change something</span> -{' '}
                  <span className="underline">3. hit update</span>
                  <br />
                  If you don't like what you hear, try <span className="underline">shuffle</span>!
                </p>
                <p>
                  To learn more about what this all means, check out the{' '}
                  <a href="https://strudel.tidalcycles.org/tutorial" target="_blank">
                    interactive tutorial
                  </a>
                  . Also feel free to join the{' '}
                  <a href="https://discord.com/invite/HGEdXmRkzT" target="_blank">
                    tidalcycles discord channel
                  </a>{' '}
                  to ask any questions, give feedback or just say hello.
                </p>
                <h3>about</h3>
                <p>
                  strudel is a JavaScript version of{' '}
                  <a href="tidalcycles.org/" target="_blank">
                    tidalcycles
                  </a>
                  , which is a popular live coding language for music, written in Haskell. You can find the source code
                  at{' '}
                  <a href="https://github.com/tidalcycles/strudel" target="_blank">
                    github
                  </a>
                  . Please consider to{' '}
                  <a href="https://opencollective.com/tidalcycles" target="_blank">
                    support this project
                  </a>{' '}
                  to ensure ongoing development 💖
                </p>
              </div>
            )}
            {activeFooter === 'console' && (
              <div className="break-all">
                {log.map((l, i) => {
                  const message = linkify(l.message);
                  return (
                    <div
                      key={l.id}
                      className={cx(l.type === 'error' && 'text-red-500', l.type === 'highlight' && 'text-highlight')}
                    >
                      <span dangerouslySetInnerHTML={{ __html: message }} />
                      {l.count ? ` (${l.count})` : ''}
                    </div>
                  );
                })}
              </div>
            )}
            {activeFooter === 'samples' && (
              <div className="break-normal w-full">
                <span className="text-white">{loadedSamples.length} banks loaded:</span>
                {loadedSamples.map(([name, samples]) => (
                  <span key={name} className="cursor-pointer hover:text-tertiary" onClick={() => {}}>
                    {' '}
                    {name}(
                    {Array.isArray(samples)
                      ? samples.length
                      : typeof samples === 'object'
                      ? Object.values(samples).length
                      : 1}
                    ){' '}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;

function useEvent(name, onTrigger, useCapture = false) {
  useEffect(() => {
    document.addEventListener(name, onTrigger, useCapture);
    return () => {
      document.removeEventListener(name, onTrigger, useCapture);
    };
  }, [onTrigger]);
}

function useLogger(onTrigger) {
  useEvent(logger.key, onTrigger);
}

function useKeydown(onTrigger) {
  useEvent('keydown', onTrigger, true);
}

function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a class="underline" href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(
    replacePattern2,
    '$1<a class="underline" href="http://$2" target="_blank">$2</a>',
  );

  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a class="underline" href="mailto:$1">$1</a>');

  return replacedText;
}
