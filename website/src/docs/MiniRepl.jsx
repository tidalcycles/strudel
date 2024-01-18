import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { silence, getPunchcardPainter, noteToMidi } from '@strudel/core';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, webaudioOutput } from '@strudel/webaudio';
import { StrudelMirror } from '@strudel/codemirror';
// import { prebake } from '@strudel/repl';
import { prebake } from '../repl/prebake.mjs';
import { loadModules } from '../repl/util.mjs';
import Claviature from '@components/Claviature';
import useClient from '@src/useClient.mjs';

let prebaked, modulesLoading;
if (typeof window !== 'undefined') {
  prebaked = prebake();
  modulesLoading = loadModules();
}

export function MiniRepl({
  tune: code,
  hideHeader = false,
  canvasHeight = 100,
  onTrigger,
  punchcard,
  punchcardLabels = true,
  claviature,
  claviatureLabels,
}) {
  const id = useMemo(() => s4(), []);
  const canvasId = useMemo(() => `canvas-${id}`, [id]);
  const shouldDraw = !!punchcard || !!claviature;
  const shouldShowCanvas = !!punchcard;
  const drawTime = punchcard ? [0, 4] : [0, 0];
  const [activeNotes, setActiveNotes] = useState([]);

  const init = useCallback(({ code, shouldDraw }) => {
    const drawContext = shouldDraw ? document.querySelector('#' + canvasId)?.getContext('2d') : null;
    let onDraw;
    if (shouldDraw) {
      onDraw = (haps, time, frame, painters) => {
        painters.length && drawContext?.clearRect(0, 0, drawContext.canvas.width * 2, drawContext.canvas.height * 2);
        painters?.forEach((painter) => {
          // ctx time haps drawTime paintOptions
          painter(drawContext, time, haps, drawTime, { clear: false });
        });
      };
    }

    const editor = new StrudelMirror({
      id,
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      autodraw: !!shouldDraw,
      root: containerRef.current,
      initialCode: '// LOADING',
      pattern: silence,
      drawTime,
      onDraw,
      editPattern: (pat, id) => {
        if (onTrigger) {
          pat = pat.onTrigger(onTrigger, false);
        }
        if (claviature) {
          editor?.painters.push((ctx, time, haps, drawTime) => {
            const active = haps
              .map((hap) => hap.value.note)
              .filter(Boolean)
              .map((n) => (typeof n === 'string' ? noteToMidi(n) : n));
            setActiveNotes(active);
          });
        }
        if (punchcard) {
          editor?.painters.push(getPunchcardPainter({ labels: !!punchcardLabels }));
        }
        return pat;
      },
      prebake: async () => Promise.all([modulesLoading, prebaked]),
      onUpdateState: (state) => {
        setReplState({ ...state });
      },
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
              onClick={() => editorRef.current?.toggle()}
            >
              <Icon type={started ? 'stop' : 'play'} />
            </button>
            <button
              className={cx(
                'w-16 flex items-center justify-center p-1 text-foreground border-lineHighlight bg-lineHighlight',
                isDirty ? 'text-foreground hover:bg-background cursor-pointer' : 'opacity-50 cursor-not-allowed',
              )}
              onClick={() => editorRef.current?.evaluate()}
            >
              <Icon type="refresh" />
            </button>
          </div>
        </div>
      )}
      <div className="overflow-auto relative p-1">
        <div
          ref={(el) => {
            if (!editorRef.current) {
              containerRef.current = el;
              init({ code, shouldDraw });
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
