import React, { useMemo } from 'react';
import * as Tone from 'tone';
import useRepl from '../useRepl';

function MiniRepl({ tune }) {
  const defaultSynth = useMemo(() => {
    return new Tone.PolySynth().chain(new Tone.Gain(0.5), Tone.Destination).set({
      oscillator: { type: 'triangle' },
      envelope: {
        release: 0.01,
      },
    });
  }, []);
  const { code, setCode, setPattern, error, cycle, dirty, log, togglePlay } = useRepl({
    tune,
    defaultSynth,
  });
  return (
    <>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <button
        className="flex-none w-full border border-gray-700 p-2 bg-slate-700 hover:bg-slate-500"
        onClick={() => togglePlay()}
      >
        {cycle.started ? 'pause' : 'play'}
      </button>
    </>
  );
}

export default MiniRepl;
