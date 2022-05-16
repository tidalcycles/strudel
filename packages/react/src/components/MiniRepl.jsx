import React, { useState } from 'react';
import { useInView } from 'react-hook-inview';
import { Tone } from '@strudel.cycles/tone';
import { evalScope } from '@strudel.cycles/eval';

import useRepl from '../hooks/useRepl.mjs';
import cx from '../cx';
import useHighlighting from '../hooks/useHighlighting.mjs';
import CodeMirror6 from './CodeMirror6';
import 'tailwindcss/tailwind.css';

evalScope(
  Tone,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
);

const defaultSynth = new Tone.PolySynth().chain(new Tone.Gain(0.5), Tone.Destination).set({
  oscillator: { type: 'triangle' },
  envelope: {
    release: 0.01,
  },
});

// "balanced" | "interactive" | "playback";
// Tone.setContext(new Tone.Context({ latencyHint: 'playback', lookAhead: 1 }));
function MiniRepl({ tune, maxHeight = 500 }) {
  const { code, setCode, pattern, activateCode, error, cycle, dirty, togglePlay } = useRepl({
    tune,
    defaultSynth,
    autolink: false,
  });
  const lines = code.split('\n').length;
  const [view, setView] = useState();
  const [ref, isVisible] = useInView({
    threshold: 0.01,
  });
  useHighlighting({ view, pattern, active: cycle.started });
  return (
    <div className="sc-rounded-md sc-overflow-hidden sc-bg-[#444C57]" ref={ref}>
      <div className="sc-flex sc-justify-between sc-bg-slate-700 sc-border-t sc-border-slate-500">
        <div className="sc-flex">
          <button
            className={cx(
              'sc-w-16 sc-flex sc-items-center sc-justify-center sc-p-1 sc-bg-slate-700 sc-border-r sc-border-slate-500  sc-text-white sc-hover:bg-slate-600',
              cycle.started ? 'sc-animate-pulse' : '',
            )}
            onClick={() => togglePlay()}
          >
            {!cycle.started ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="sc-h-5 sc-w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="sc-h-5 sc-w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <button
            className={cx(
              'sc-w-16 sc-flex sc-items-center sc-justify-center sc-p-1 sc-border-slate-500 sc-hover:bg-slate-600',
              dirty
                ? 'sc-bg-slate-700 sc-border-r sc-border-slate-500 sc-text-white'
                : 'sc-bg-slate-600 sc-text-slate-400 sc-cursor-not-allowed',
            )}
            onClick={() => activateCode()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="sc-h-5 sc-w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="sc-text-right sc-p-1 sc-text-sm">
          {error && <span className="sc-text-red-200">{error.message}</span>}
        </div>{' '}
      </div>
      <div className="sc-flex sc-space-y-0 sc-overflow-auto sc-relative">
        {isVisible && <CodeMirror6 value={code} onChange={setCode} onViewChanged={setView} />}
      </div>
      {/* <div className="bg-slate-700 border-t border-slate-500 content-right pr-2 text-right">
        <a href={`https://strudel.tidalcycles.org/#${hash}`} className="text-white items-center inline-flex">
          <span>open in REPL</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </div> */}
    </div>
  );
}

export default MiniRepl;
