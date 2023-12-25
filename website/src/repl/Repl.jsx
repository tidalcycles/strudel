/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import { cleanupDraw, cleanupUi, code2hash, getDrawContext, logger } from '@strudel.cycles/core';
import { CodeMirror, cx, flash, useHighlighting, useKeydown, useStrudel } from '@strudel.cycles/react';
import { useWidgets } from '@strudel.cycles/react/src/hooks/useWidgets.mjs';
import { getAudioContext, initAudioOnFirstClick, resetLoadedSounds, webaudioOutput } from '@strudel.cycles/webaudio';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  initUserCode,
  setActivePattern,
  setLatestCode,
  settingsMap,
  updateUserCode,
  useSettings,
} from '../settings.mjs';
import { Header } from './Header';
import Loader from './Loader';
import './Repl.css';
import { registerSamplesFromDB, userSamplesDBConfig } from './idbutils.mjs';
import { Panel } from './panel/Panel';
import { prebake } from './prebake.mjs';
import { themes } from './themes.mjs';
import { getRandomTune, initCode, loadModules, shareCode } from './util.mjs';

const { latestCode } = settingsMap.get();

initAudioOnFirstClick();

const modulesLoading = loadModules();
const presets = prebake();

let drawContext, clearCanvas;
if (typeof window !== 'undefined') {
  drawContext = getDrawContext();
  clearCanvas = () => drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
}

const getTime = () => getAudioContext().currentTime;

const { code: randomTune, name } = getRandomTune();

export const ReplContext = createContext(null);

export function Repl({ embedded = false }) {
  const isEmbedded = embedded || window.location !== window.parent.location;
  const [view, setView] = useState(); // codemirror view
  const [pending, setPending] = useState(true);
  const {
    theme,
    keybindings,
    fontSize,
    fontFamily,
    isLineNumbersDisplayed,
    isActiveLineHighlighted,
    isAutoCompletionEnabled,
    isTooltipEnabled,
    isLineWrappingEnabled,
    panelPosition,
    isZen,
  } = useSettings();

  const paintOptions = useMemo(() => ({ fontFamily }), [fontFamily]);
  const { setWidgets } = useWidgets(view);
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
        updateUserCode(code);
        setMiniLocations(meta.miniLocations);
        setWidgets(meta.widgets);
        setPending(false);
        setLatestCode(code);
        window.location.hash = '#' + code2hash(code);
      },
      onEvalError: (err) => {
        setPending(false);
      },
      onToggle: (play) => {
        if (!play) {
          cleanupDraw(false);
          window.postMessage('strudel-stop');
        } else {
          window.postMessage('strudel-start');
        }
      },
      drawContext,
      // drawTime: [0, 6],
      paintOptions,
    });

  // init code
  useEffect(() => {
    initCode().then((decoded) => {
      let msg;
      if (decoded) {
        setCode(decoded);
        initUserCode(decoded);
        msg = `I have loaded the code from the URL.`;
      } else if (latestCode) {
        setCode(latestCode);
        msg = `Your last session has been loaded!`;
      } /*  if(randomTune) */ else {
        setCode(randomTune);
        msg = `A random code snippet named "${name}" has been loaded!`;
      }
      //registers samples that have been saved to the index DB
      registerSamplesFromDB(userSamplesDBConfig);
      logger(`Welcome to Strudel! ${msg} Press play or hit ctrl+enter to run it!`, 'highlight');
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
      // started && logger('[edit] code changed. hit ctrl+enter to update');
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
  const handleUpdate = async (newCode, reset = false) => {
    if (reset) {
      clearCanvas();
      resetLoadedSounds();
      scheduler.setCps(1);
      await prebake(); // declare default samples
    }
    (newCode || isDirty) && activateCode(newCode);
    logger('[repl] code updated!');
  };

  const handleShuffle = async () => {
    const { code, name } = getRandomTune();
    logger(`[repl] ✨ loading random tune "${name}"`);
    setActivePattern(name);
    clearCanvas();
    resetLoadedSounds();
    scheduler.setCps(1);
    await prebake(); // declare default samples
    await evaluate(code, false);
  };

  const handleShare = async () => shareCode(activeCode || code);
  const context = {
    scheduler,
    embedded,
    started,
    pending,
    isDirty,
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
          'h-full flex flex-col relative',
          // overflow-hidden
        )}
      >
        <Loader active={pending} />
        <Header context={context} />
        {isEmbedded && !started && (
          <button
            onClick={() => handleTogglePlay()}
            className="text-white text-2xl fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[1000] m-auto p-4 bg-black rounded-md flex items-center space-x-2"
          >
            <PlayCircleIcon className="w-6 h-6" />
            <span>play</span>
          </button>
        )}
        <div className="grow flex relative overflow-hidden">
          <section className={'text-gray-100 cursor-text pb-0 overflow-auto grow' + (isZen ? ' px-10' : '')} id="code">
            <CodeMirror
              theme={currentTheme}
              value={code}
              keybindings={keybindings}
              isLineNumbersDisplayed={isLineNumbersDisplayed}
              isActiveLineHighlighted={isActiveLineHighlighted}
              isAutoCompletionEnabled={isAutoCompletionEnabled}
              isTooltipEnabled={isTooltipEnabled}
              isLineWrappingEnabled={isLineWrappingEnabled}
              fontSize={fontSize}
              fontFamily={fontFamily}
              onChange={handleChangeCode}
              onViewChanged={handleViewChanged}
              onSelectionChange={handleSelectionChange}
            />
          </section>
          {panelPosition === 'right' && !isEmbedded && <Panel context={context} />}
        </div>
        {error && (
          <div className="text-red-500 p-4 bg-lineHighlight animate-pulse">{error.message || 'Unknown Error :-/'}</div>
        )}
        {panelPosition === 'bottom' && !isEmbedded && <Panel context={context} />}
      </div>
    </ReplContext.Provider>
  );
}
