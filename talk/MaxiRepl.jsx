import { evalScope } from '@strudel.cycles/eval';
import { MiniRepl as _MiniRepl } from '@strudel.cycles/react';
import controls from '@strudel.cycles/core/controls.mjs';
import { loadWebDirt } from '@strudel.cycles/webdirt';
import { materialPalenightLarge } from './materialPalenightThemeLarge';
import { useState, useEffect } from 'react';
import { cleanupDraw, cleanupUi, Tone, piano } from '@strudel.cycles/tone';
import { midi2note } from '@strudel.cycles/core';

let defaultPiano;
piano().then((instrument) => {
  defaultPiano = instrument.toDestination();
});

const init = evalScope(
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

export function MaxiRepl({ code, canvasHeight = 500 }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const examples = Array.isArray(code) ? code : [code];
  const [ready, setReady] = useState(false);
  useEffect(() => {
    init.then(() => setReady(true));
  }, []);
  useEffect(() => {
    cleanupDraw();
    cleanupUi();
  }, [exampleIndex]);
  return (
    <div className="text-left block max-w-screen relative">
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
        hideOutsideView={true}
        theme={materialPalenightLarge}
        init={ready}
        onEvent={(time, hap) => {
          if (hap.context.onTrigger) {
            // dont need default synth
            return;
          }
          let velocity = hap.context?.velocity ?? 0.75;
          note = hap.value;
          if (typeof note === 'number') {
            note = midi2note(note);
          }
          defaultPiano.keyDown({ note, time, velocity });
          defaultPiano.keyUp({ note, time: time + hap.duration.valueOf(), velocity });
        }}
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
