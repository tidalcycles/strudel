/*
App.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import { getDrawContext, logger, $replstate } from '@strudel.cycles/core';
import { cx } from '@strudel.cycles/react';
import { getAudioContext } from '@strudel.cycles/webaudio';
import { writeText } from '@tauri-apps/api/clipboard';
import { nanoid } from 'nanoid';
import { createContext, useState } from 'react';
import { useSettings } from '../settings.mjs';
import { isTauri } from '../tauri.mjs';
import { Footer } from './Footer';
import { Header } from './Header';
import Loader from './Loader';
import './Repl.css';
import { resetSounds } from './prebake.mjs';
import { useStore } from '@nanostores/react';

let clearCanvas;
if (typeof window !== 'undefined') {
  const drawContext = getDrawContext();
  clearCanvas = () => drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
}

export const ReplContext = createContext(null);

export function Repl({ embedded = false }) {
  //const isEmbedded = embedded || window.location !== window.parent.location;
  const isEmbedded = false;
  const [lastShared, setLastShared] = useState();
  const { panelPosition, isZen } = useSettings();
  const replState = useStore($replstate);

  //
  // UI Actions
  //

  const handleTogglePlay = async () => {
    console.log('toggle.');
    window.postMessage('strudel-toggle-play');
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
    const { code, name } = getRandomTune();
    logger(`[repl] ✨ loading random tune "${name}"`);
    clearCanvas();
    await resetSounds();
    // scheduler.setCps(1);
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
  };
  const pending = false;
  const error = undefined;
  const { started, activeCode } = replState;
  const context = {
    // scheduler,
    embedded,
    started,
    pending,
    isDirty: false,
    lastShared,
    activeCode,
    // handleChangeCode: codemirror.handleChangeCode,
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
            ref={() => {
              window.postMessage('strudel-container');
            }}
          >
            {/* <CodeMirror {...codemirror} /> */}
          </section>
          {panelPosition === 'right' && !isEmbedded && <Footer context={context} />}
        </div>
        {error && (
          <div className="text-red-500 p-4 bg-lineHighlight animate-pulse">{error.message || 'Unknown Error :-/'}</div>
        )}
        {panelPosition === 'bottom' && !isEmbedded && <Footer context={context} />}
      </div>
    </ReplContext.Provider>
  );
}
