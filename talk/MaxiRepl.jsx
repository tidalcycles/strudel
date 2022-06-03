import { Tone } from '@strudel.cycles/tone';
import { evalScope } from '@strudel.cycles/eval';
import { MiniRepl as _MiniRepl } from '@strudel.cycles/react';
import controls from '@strudel.cycles/core/controls.mjs';
import { loadWebDirt } from '@strudel.cycles/webdirt';
import { materialPalenightLarge } from './materialPalenightThemeLarge';
import { useState } from 'react';

export const defaultSynth = new Tone.PolySynth().chain(new Tone.Gain(0.5), Tone.Destination).set({
  oscillator: { type: 'triangle' },
  envelope: {
    release: 0.01,
  },
});

evalScope(
  Tone,
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/webdirt'),
);

loadWebDirt({
  sampleMapUrl: './samples.json',
  sampleFolder: './EmuSP12',
});

export function MaxiRepl({ code, canvasHeight = 400 }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const examples = Array.isArray(code) ? code : [code];
  return (
    <div className="text-left block relative">
      {examples.length > 1 && (
        <div className="space-x-2 absolute right-2">
          {examples.map((c, i) => (
            <button
              key={i}
              onClick={() => setExampleIndex(i)}
              className={`rounded-full ${exampleIndex === i ? 'bg-gray-200 w-5 h-5' : 'bg-gray-500 w-5 h-5'}`}
            ></button>
          ))}
        </div>
      )}
      <_MiniRepl
        key={exampleIndex}
        tune={examples[exampleIndex]}
        defaultSynth={defaultSynth}
        hideOutsideView={true}
        theme={materialPalenightLarge}
      />
      <canvas
        id="test-canvas"
        className="w-full pointer-events-none"
        height={canvasHeight}
        ref={(el) => {
          if (el) {
            el.width = el.clientWidth;
          }
        }}
      ></canvas>
    </div>
  );
}
