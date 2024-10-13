import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { silence, noteToMidi, _mod } from '@strudel/core';
import { clearHydra } from '@strudel/hydra';
import { getDrawContext, getPunchcardPainter } from '@strudel/draw';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick } from '@strudel/webaudio';
import { StrudelMirror } from '@strudel/codemirror';
import { prebake } from '../repl/prebake.mjs';
import { loadModules, setVersionDefaultsFrom } from '../repl/util.mjs';
import Claviature from '@components/Claviature';
import useClient from '@src/useClient.mjs';

let prebaked, modulesLoading, audioReady;
if (typeof window !== 'undefined') {
  prebaked = prebake();
  modulesLoading = loadModules();
  audioReady = initAudioOnFirstClick();
}

export function MiniRepl({
  tune,
  tunes,
  hideHeader = false,
  canvasHeight = 100,
  onTrigger,
  punchcard,
  punchcardLabels = true,
  claviature,
  claviatureLabels,
  maxHeight,
  autodraw,
  drawTime,
}) {
  const code = tunes ? tunes[0] : tune;
  const id = useMemo(() => s4(), []);
  const shouldShowCanvas = !!punchcard;
  const canvasId = shouldShowCanvas ? useMemo(() => `canvas-${id}`, [id]) : null;
  autodraw = !!punchcard || !!claviature || !!autodraw;
  drawTime = drawTime ?? punchcard ? [0, 4] : [-2, 2];
  if (claviature) {
    drawTime = [0, 0];
  }
  const [activeNotes, setActiveNotes] = useState([]);

  const init = useCallback(({ code, autodraw }) => {
    const drawContext = canvasId ? document.querySelector('#' + canvasId)?.getContext('2d') : getDrawContext();

    const editor = new StrudelMirror({
      id,
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      autodraw,
      root: containerRef.current,
      initialCode: '// LOADING',
      pattern: silence,
      drawTime,
      drawContext,
      editPattern: (pat, id) => {
        if (onTrigger) {
          pat = pat.onTrigger(onTrigger, false);
        }
        if (claviature) {
          pat = pat.onPaint((ctx, time, haps, drawTime) => {
            const active = haps
              .map((hap) => hap.value.note)
              .filter(Boolean)
              .map((n) => (typeof n === 'string' ? noteToMidi(n) : n));
            setActiveNotes(active);
          });
        }
        if (punchcard) {
          pat = pat.punchcard({ labels: !!punchcardLabels });
        }
        return pat;
      },
      prebake: async () => Promise.all([modulesLoading, prebaked]),
      onUpdateState: (state) => {
        setReplState({ ...state });
      },
      onToggle: (playing) => {
        if (!playing) {
          // clearHydra(); // TBD: doesn't work with multiple MiniRepl's on a page
        }
      },
      beforeStart: () => audioReady,
      afterEval: ({ code }) => setVersionDefaultsFrom(code),
    });
    // init settings
    editor.setCode(code);
    editorRef.current = editor;
  }, []);

  const [replState, setReplState] = useState({});
  const { started, isDirty, error } = replState;
  const editorRef = useRef();
  const containerRef = useRef();
  const client = useClient();

  const [tuneIndex, setTuneIndex] = useState(0);
  const changeTune = (index) => {
    index = _mod(index, tunes.length);
    setTuneIndex(index);
    editorRef.current?.setCode(tunes[index]);
    editorRef.current?.evaluate();
  };

  if (!client) {
    return <pre>{code}</pre>;
  }

  return (
    <div className="overflow-hidden rounded-t-md bg-background border border-lineHighlight">
      {!hideHeader && (
        <div className="flex justify-between bg-lineHighlight">
          <div className="flex">
            <button
              className={cx(
                'cursor-pointer w-16 flex items-center justify-center p-1 border-r border-lineHighlight text-foreground bg-lineHighlight hover:bg-background',
                started ? 'animate-pulse' : '',
              )}
              aria-label={started ? 'stop' : 'play'}
              onClick={() => editorRef.current?.toggle()}
            >
              <Icon type={started ? 'stop' : 'play'} />
            </button>
            <button
              className={cx(
                'w-16 flex items-center justify-center p-1 text-foreground border-lineHighlight bg-lineHighlight',
                isDirty ? 'text-foreground hover:bg-background cursor-pointer' : 'opacity-50 cursor-not-allowed',
              )}
              aria-label="update"
              onClick={() => editorRef.current?.evaluate()}
            >
              <Icon type="refresh" />
            </button>
          </div>
          {tunes && (
            <div className="flex">
              <button
                className={
                  'cursor-pointer w-16 flex items-center justify-center p-1 border-r border-lineHighlight text-foreground bg-lineHighlight hover:bg-background'
                }
                aria-label="previous example"
                onClick={() => changeTune(tuneIndex - 1)}
              >
                <div className="rotate-180">
                  <Icon type="skip" />
                </div>
              </button>
              <button
                className={
                  'cursor-pointer w-16 flex items-center justify-center p-1 border-r border-lineHighlight text-foreground bg-lineHighlight hover:bg-background'
                }
                aria-label="next example"
                onClick={() => changeTune(tuneIndex + 1)}
              >
                <Icon type="skip" />
              </button>
            </div>
          )}
        </div>
      )}
      <div className="overflow-auto relative p-1" style={maxHeight ? { maxHeight: `${maxHeight}px` } : {}}>
        <div
          ref={(el) => {
            if (!editorRef.current) {
              containerRef.current = el;
              init({ code, autodraw });
            }
          }}
        ></div>
        {error && <div className="text-right p-1 text-md text-red-200">{error.message}</div>}
      </div>
      {shouldShowCanvas && (
        <canvas
          id={canvasId}
          className="w-full pointer-events-none border-t border-lineHighlight"
          height={canvasHeight}
          ref={(el) => {
            if (el && el.width !== el.clientWidth) {
              el.width = el.clientWidth;
            }
          }}
        ></canvas>
      )}
      {/* !!log.length && (
      <div className="bg-gray-800 rounded-md p-2">
        {log.map(({ message }, i) => (
          <div key={i}>{message}</div>
        ))}
      </div>
    ) */}
      {claviature && (
        <Claviature
          options={{
            range: ['C2', 'C6'],
            scaleY: 0.75,
            colorize: [{ keys: activeNotes, color: 'steelblue' }],
            labels: claviatureLabels || {},
          }}
        />
      )}
    </div>
  );
}

function cx(...classes) {
  // : Array<string | undefined>
  return classes.filter(Boolean).join(' ');
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}
