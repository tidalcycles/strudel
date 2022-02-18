import React, { useMemo } from 'react';
import * as Tone from 'tone';
import useRepl from '../useRepl';
import CodeMirror from '../CodeMirror';
import cx from '../cx';

const defaultSynth = new Tone.PolySynth().chain(new Tone.Gain(0.5), Tone.Destination).set({
  oscillator: { type: 'triangle' },
  envelope: {
    release: 0.01,
  },
});

function MiniRepl({ tune, height = 100 }) {
  const { code, setCode, activateCode, activeCode, setPattern, error, cycle, dirty, log, togglePlay } = useRepl({
    tune,
    defaultSynth,
    autolink: false,
  });
  return (
    <div className="flex space-y-0 overflow-auto" style={{ height }}>
      <div className="w-16 flex flex-col">
        <button
          className="grow bg-slate-700 border-b border-slate-500  text-white hover:bg-slate-600 "
          onClick={() => togglePlay()}
        >
          {cycle.started ? 'pause' : 'play'}
        </button>
        <button
          className={cx(
            'grow  border-slate-500  hover:bg-slate-600',
            activeCode && dirty ? 'bg-slate-700 text-white' : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          )}
          onClick={() => activateCode()}
        >
          update
        </button>
      </div>
      <CodeMirror
        className="w-full"
        value={code}
        options={{
          mode: 'javascript',
          theme: 'material',
          lineNumbers: true,
        }}
        onChange={(_: any, __: any, value: any) => setCode(value)}
      />
      {/* <textarea className="w-full" value={code} onChange={(e) => setCode(e.target.value)} /> */}
    </div>
  );
}

export default MiniRepl;
