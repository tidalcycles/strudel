/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { cleanupDraw, cleanupUi, controls, evalScope, getDrawContext, logger } from '@strudel.cycles/core';
import {
  CodeMirror,
  cx,
  flash,
  useHighlighting,
  useStrudel,
  useKeydown,
  updateMiniLocations,
} from '@strudel.cycles/react';
import { getAudioContext, initAudioOnFirstClick, resetLoadedSounds, webaudioOutput } from '@strudel.cycles/webaudio';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import React, { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import './Repl.css';
import { Footer } from './Footer';
import { Header } from './Header';
import { prebake } from './prebake.mjs';
import * as tunes from './tunes.mjs';
import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import { themes } from './themes.mjs';
import { settingsMap, useSettings, setLatestCode } from '../settings.mjs';
import Loader from './Loader';
import { settingPatterns } from '../settings.mjs';

const { latestCode } = settingsMap.get();

initAudioOnFirstClick();

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
);

const modules = [
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/serial'),
  import('@strudel.cycles/soundfonts'),
  import('@strudel.cycles/csound'),
];

const modulesLoading = evalScope(
  controls, // sadly, this cannot be exported from core direclty
  settingPatterns,
  ...modules,
);

const presets = prebake();

let drawContext, clearCanvas;
if (typeof window !== 'undefined') {
  drawContext = getDrawContext();
  clearCanvas = () => drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
}

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
            //console.log('load hash from database', hash);
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

export const ReplContext = createContext(null);

export function Repl({ embedded = false }) {
  const isEmbedded = embedded || window.location !== window.parent.location;
  const [view, setView] = useState(); // codemirror view
  const [lastShared, setLastShared] = useState();
  const [pending, setPending] = useState(true);
  const {
    theme,
    keybindings,
    fontSize,
    fontFamily,
    isLineNumbersDisplayed,
    isAutoCompletionEnabled,
    isLineWrappingEnabled,
  } = useSettings();

  const { code, setCode, scheduler, evaluate, activateCode, isDirty, activeCode, pattern, started, stop, error } =
    useStrudel({
      initialCode: '// LOADING...',
      defaultOutput: webaudioOutput,
      getTime,
      beforeEval: async () => {
        setPending(true);
        await modulesLoading;
        cleanupUi();
        cleanupDraw();
      },
      afterEval: ({ code, meta }) => {
        setMiniLocations(meta.miniLocations);
        setPending(false);
        setLatestCode(code);
        window.location.hash = '#' + encodeURIComponent(btoa(code));
      },
      onEvalError: (err) => {
        setPending(false);
      },
      onToggle: (play) => !play && cleanupDraw(false),
      drawContext,
    });

  // init code
  useEffect(() => {
    initCode().then((decoded) => {
      logger(
        `Welcome to Strudel! ${
          decoded ? `I have loaded the code from the URL.` : `A random code snippet named "${name}" has been loaded!`
        } Press play or hit ctrl+enter to run it!`,
        'highlight',
      );
      setCode(decoded || latestCode || randomTune);
      setPending(false);
    });
  }, []);

  // keyboard shortcuts
  useKeydown(
    useCallback(
      async (e) => {
        if (e.ctrlKey || e.altKey) {
          if (e.code === 'Enter') {
            if (getAudioContext().state !== 'running') {
              alert('please click play to initialize the audio. you can use shortcuts after that!');
              return;
            }
            e.preventDefault();
            flash(view);
            await activateCode();
          } else if (e.key === '.' || e.code === 'Period') {
            stop();
            e.preventDefault();
          }
        }
      },
      [activateCode, stop, view],
    ),
  );

  // highlighting
  const { setMiniLocations } = useHighlighting({
    view,
    pattern,
    active: started && !activeCode?.includes('strudel disable-highlighting'),
    getTime: () => scheduler.now(),
  });

  //
  // UI Actions
  //

  const handleChangeCode = useCallback(
    (c) => {
      setCode(c);
      started && logger('[edit] code changed. hit ctrl+enter to update');
    },
    [started],
  );
  const handleSelectionChange = useCallback((selection) => {
    // TODO: scroll to selected function in reference
    // console.log('selectino change', selection.ranges[0].from);
  }, []);

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
    clearCanvas();
    resetLoadedSounds();
    scheduler.setCps(1);
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
    const shareUrl = window.location.origin + window.location.pathname + '?' + hash;
    const { data, error } = await supabase.from('code').insert([{ code: codeToShare, hash }]);
    if (!error) {
      setLastShared(activeCode || code);
      // copy shareUrl to clipboard
      await navigator.clipboard.writeText(shareUrl);
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
  const context = {
    scheduler,
    embedded,
    started,
    pending,
    isDirty,
    lastShared,
    activeCode,
    handleChangeCode,
    handleTogglePlay,
    handleUpdate,
    handleShuffle,
    handleShare,
  };
  const currentTheme = useMemo(() => themes[theme] || themes.strudelTheme, [theme]);
  const handleViewChanged = useCallback((v) => {
    setView(v);
  }, []);

  return (
    // bg-gradient-to-t from-blue-900 to-slate-900
    // bg-gradient-to-t from-green-900 to-slate-900
    <ReplContext.Provider value={context}>
      <div
        className={cx(
          'h-full flex flex-col',
          //        'bg-gradient-to-t from-green-900 to-slate-900', //
        )}
      >
        <Loader active={pending} />
        <Header context={context} />
        <section className="grow flex text-gray-100 relative overflow-auto cursor-text pb-0" id="code">
          <CodeMirror
            theme={currentTheme}
            value={code}
            keybindings={keybindings}
            isLineNumbersDisplayed={isLineNumbersDisplayed}
            isAutoCompletionEnabled={isAutoCompletionEnabled}
            isLineWrappingEnabled={isLineWrappingEnabled}
            fontSize={fontSize}
            fontFamily={fontFamily}
            onChange={handleChangeCode}
            onViewChanged={handleViewChanged}
            onSelectionChange={handleSelectionChange}
          />
        </section>
        {error && (
          <div className="text-red-500 p-4 bg-lineHighlight animate-pulse">{error.message || 'Unknown Error :-/'}</div>
        )}
        {isEmbedded && !started && (
          <button
            onClick={() => handleTogglePlay()}
            className="text-white text-2xl fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[1000] m-auto p-4 bg-black rounded-md flex items-center space-x-2"
          >
            <PlayCircleIcon className="w-6 h-6" />
            <span>play</span>
          </button>
        )}
        {!isEmbedded && <Footer context={context} />}
      </div>
    </ReplContext.Provider>
  );
}
