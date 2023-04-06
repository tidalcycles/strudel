import { useState, useCallback } from 'react';
import { atomone } from '@uiw/codemirror-themes-all';
import { CodeMirror, flash, useKeydown } from '@strudel.cycles/react';
import { initAudioOnFirstClick, webaudioOutput } from '@strudel.cycles/webaudio';
import { TimeSpan } from '@strudel.cycles/core';

const initAudio = initAudioOnFirstClick();

function EventEditor({ code: initialCode }) {
  const [code, setCode] = useState(initialCode);
  const [view, setView] = useState();
  useKeydown(
    useCallback(
      async (e) => {
        if (view?.hasFocus) {
          if (e.ctrlKey || e.altKey) {
            if (e.code === 'Enter') {
              /* if (getAudioContext().state !== 'running') {
              alert('please click play to initialize the audio. you can use shortcuts after that!');
              return;
            } */
              e.preventDefault();
              flash(view);
              let json = JSON.parse(code);
              if (!Array.isArray(json)) {
                json = [json];
              }
              await initAudio;
              json.forEach((value) => {
                const hap = new Hap(new TimeSpan(0, 1), new TimeSpan(0, 1), value);
                webaudioOutput(hap, 0.1, 1, 1);
              });
            } else if (e.key === '.') {
              stop();
              e.preventDefault();
            }
          }
        }
      },
      [code, view],
    ),
  );
  return <CodeMirror value={code} onChange={setCode} theme={atomone} onViewChanged={(v) => setView(v)} fontSize={32} />;
}

export default EventEditor;
