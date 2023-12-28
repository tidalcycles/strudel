/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { code2hash, getDrawContext, logger, silence } from '@strudel.cycles/core';
import { cx } from '@strudel.cycles/react';
import { transpiler } from '@strudel.cycles/transpiler';
import { getAudioContext, initAudioOnFirstClick, webaudioOutput } from '@strudel.cycles/webaudio';
import { StrudelMirror, defaultSettings } from '@strudel/codemirror';
/* import { writeText } from '@tauri-apps/api/clipboard';
import { nanoid } from 'nanoid'; */
import { createContext, useCallback, useEffect, useRef, useState } from 'react';
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
import { Panel } from './panel/Panel';
// import { prebake } from '@strudel/repl';
import { useStore } from '@nanostores/react';
import { prebake /* , resetSounds */ } from './prebake.mjs';
import { getRandomTune, initCode, loadModules, shareCode } from './util.mjs';
import './Repl.css';

const { code: randomTune, name } = getRandomTune();
export const ReplContext = createContext(null);

const { latestCode } = settingsMap.get();

initAudioOnFirstClick();

const modulesLoading = loadModules();
const presets = prebake();

let drawContext, clearCanvas;
if (typeof window !== 'undefined') {
  drawContext = getDrawContext();
  clearCanvas = () => drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
}

// const getTime = () => getAudioContext().currentTime;

export function Repl2({ embedded = false }) {
  //const isEmbedded = embedded || window.location !== window.parent.location;
  const isEmbedded = false;
  const { panelPosition, isZen } = useSettings();
  /* const replState = useStore($replstate);
  const isDirty = useStore($repldirty); */
  const shouldDraw = true;

  const init = useCallback(({ shouldDraw }) => {
    const drawTime = [-2, 2];
    const drawContext = shouldDraw ? getDrawContext() : null;
    let onDraw;
    if (shouldDraw) {
      onDraw = (haps, time, frame, painters) => {
        painters.length && drawContext.clearRect(0, 0, drawContext.canvas.width * 2, drawContext.canvas.height * 2);
        painters?.forEach((painter) => {
          // ctx time haps drawTime paintOptions
          painter(drawContext, time, haps, drawTime, { clear: false });
        });
      };
    }
    const editor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      autodraw: false,
      root: containerRef.current,
      initialCode: '// LOADING',
      pattern: silence,
      drawTime,
      onDraw,
      prebake: async () => Promise.all([modulesLoading, presets]),
      onUpdateState: (state) => {
        setReplState({ ...state });
      },
      afterEval: ({ code }) => {
        updateUserCode(code);
        // setPending(false);
        setLatestCode(code);
        window.location.hash = '#' + code2hash(code);
      },
      bgFill: false,
    });
    // init settings
    initCode().then((decoded) => {
      let msg;
      if (decoded) {
        editor.setCode(decoded);
        initUserCode(decoded);
        msg = `I have loaded the code from the URL.`;
      } else if (latestCode) {
        editor.setCode(latestCode);
        msg = `Your last session has been loaded!`;
      } /*  if(randomTune) */ else {
        editor.setCode(randomTune);
        msg = `A random code snippet named "${name}" has been loaded!`;
      }
      logger(`Welcome to Strudel! ${msg} Press play or hit ctrl+enter to run it!`, 'highlight');
      // setPending(false);
    });

    editorRef.current = editor;
  }, []);

  const [replState, setReplState] = useState({});
  const { started, isDirty, error, activeCode } = replState;
  const editorRef = useRef();
  const containerRef = useRef();
  const [client, setClient] = useState(false);
  useEffect(() => {
    setClient(true);
    if (!editorRef.current) {
      setTimeout(() => {
        init({ shouldDraw });
      });
    }
    return () => {
      editorRef.current?.clear();
      delete editorRef.current;
    };
  }, []);

  // this can be simplified once SettingsTab has been refactored to change codemirrorSettings directly!
  // this will be the case when the main repl is being replaced
  const _settings = useStore(settingsMap, { keys: Object.keys(defaultSettings) });
  useEffect(() => {
    let editorSettings = {};
    Object.keys(defaultSettings).forEach((key) => {
      if (_settings.hasOwnProperty(key)) {
        editorSettings[key] = _settings[key];
      }
    });
    editorRef.current?.updateSettings(editorSettings);
  }, [_settings]);

  //
  // UI Actions
  //

  const handleTogglePlay = async () => editorRef.current?.toggle();
  const handleUpdate = async (newCode, reset = false) => {
    if (reset) {
      clearCanvas();
      resetLoadedSounds();
      editorRef.current.repl.setCps(1);
      await prebake(); // declare default samples
    }
    if (newCode || isDirty) {
      editorRef.current.setCode(newCode);
      editorRef.current.repl.evaluate(newCode);
    }
    logger('[repl] code updated!');
  };
  const handleShuffle = async () => {
    // window.postMessage('strudel-shuffle');
    const { code, name } = getRandomTune();
    logger(`[repl] ✨ loading random tune "${name}"`);
    setActivePattern(name);
    clearCanvas();
    resetLoadedSounds();
    editorRef.current.repl.setCps(1);
    await prebake(); // declare default samples
    editorRef.current.setCode(code);
    editorRef.current.repl.evaluate(code);
  };

  const handleShare = async () => shareCode(activeCode);
  const pending = false;
  //const error = undefined;
  // const { started, activeCode } = replState;

  const context = {
    // scheduler,
    embedded,
    started,
    pending,
    isDirty,
    activeCode,
    handleTogglePlay,
    handleUpdate,
    handleShuffle,
    handleShare,
  };

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
        {/* isEmbedded && !started && (
          <button
            onClick={() => handleTogglePlay()}
            className="text-white text-2xl fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[1000] m-auto p-4 bg-black rounded-md flex items-center space-x-2"
          >
            <PlayCircleIcon className="w-6 h-6" />
            <span>play</span>
          </button>
        ) */}
        <div className="grow flex relative overflow-hidden">
          <section
            className={'text-gray-100 cursor-text pb-0 overflow-auto grow' + (isZen ? ' px-10' : '')}
            id="code"
            ref={containerRef}
          ></section>
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
