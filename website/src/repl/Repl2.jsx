/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { logger, getDrawContext, silence, evalScope, controls } from '@strudel.cycles/core';
import { cx } from '@strudel.cycles/react';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import { transpiler } from '@strudel.cycles/transpiler';
import { StrudelMirror } from '@strudel/codemirror';
/* import { writeText } from '@tauri-apps/api/clipboard';
import { nanoid } from 'nanoid'; */
import { createContext, useState } from 'react';
import { useSettings } from '../settings.mjs';
import { isTauri } from '../tauri.mjs';
import { Panel } from './panel/Panel';
import { Header } from './Header';
import Loader from './Loader';
import './Repl.css';
import { useCallback, useRef, useEffect } from 'react';
// import { prebake } from '@strudel/repl';
import { prebake /* , resetSounds */ } from './prebake.mjs';

export const ReplContext = createContext(null);

export function Repl2({ embedded = false }) {
  //const isEmbedded = embedded || window.location !== window.parent.location;
  const isEmbedded = false;
  const [lastShared, setLastShared] = useState();
  const { panelPosition, isZen } = useSettings();
  /* const replState = useStore($replstate);
  const isDirty = useStore($repldirty); */
  const shouldDraw = true;

  const init = useCallback(({ code, shouldDraw }) => {
    const drawTime = [0, 4];
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
      prebake: async () => {
        let modules = [
          import('@strudel.cycles/core'),
          import('@strudel.cycles/tonal'),
          import('@strudel.cycles/mini'),
          import('@strudel.cycles/xen'),
          import('@strudel.cycles/webaudio'),
          import('@strudel/codemirror'),
          import('@strudel/hydra'),
          import('@strudel.cycles/serial'),
          import('@strudel.cycles/soundfonts'),
          import('@strudel.cycles/csound'),
        ];
        if (isTauri()) {
          modules = modules.concat([
            import('@strudel/desktopbridge/loggerbridge.mjs'),
            import('@strudel/desktopbridge/midibridge.mjs'),
            import('@strudel/desktopbridge/oscbridge.mjs'),
          ]);
        } else {
          modules = modules.concat([import('@strudel.cycles/midi'), import('@strudel.cycles/osc')]);
        }

        const modulesLoading = evalScope(
          controls, // sadly, this cannot be exported from core direclty
          // settingPatterns,
          ...modules,
        );
        await Promise.all([modulesLoading, prebake()]);
      },
      onUpdateState: (state) => {
        setReplState({ ...state });
      },
    });
    // init settings
    editor.setCode(code);
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
        init({ code: 's("bd")', shouldDraw });
      });
    }
    return () => {
      editor.clear();
    };
  }, []);

  //
  // UI Actions
  //

  const handleTogglePlay = async () => {
    editorRef.current?.toggle();
    /* await getAudioContext().resume(); // fixes no sound in ios webkit
    if (!started) {
      logger('[repl] started. tip: you can also start by pressing ctrl+enter', 'highlight');
      activateCode();
    } else {
      logger('[repl] stopped. tip: you can also stop by pressing ctrl+dot', 'highlight');
      stop();
    } */
  };
  const handleUpdate = () => {
    isDirty && activateCode();
    logger('[repl] code updated! tip: you can also update the code by pressing ctrl+enter', 'highlight');
  };

  const handleShuffle = async () => {
    // window.postMessage('strudel-shuffle');
  };

  /*  const handleShare = async () => {
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
      if (isTauri()) {
        await writeText(shareUrl);
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
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
  }; */
  const pending = false;
  //const error = undefined;
  // const { started, activeCode } = replState;

  const context = {
    // scheduler,
    embedded,
    started,
    pending,
    isDirty,
    lastShared,
    activeCode,
    // handleChangeCode: codemirror.handleChangeCode,
    handleTogglePlay,
    handleUpdate,
    handleShuffle,
    /* handleShare, */
    handleShare: () => {},
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
