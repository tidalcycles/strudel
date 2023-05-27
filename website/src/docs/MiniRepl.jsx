import { evalScope, controls, noteToMidi } from '@strudel.cycles/core';
import { initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import { useEffect, useState } from 'react';
import { prebake } from '../repl/prebake';
import { themes, settings } from '../repl/themes.mjs';
import './MiniRepl.css';
import { useSettings } from '../settings.mjs';
import Claviature from '@components/Claviature';

let modules;
if (typeof window !== 'undefined') {
  modules = evalScope(
    controls,
    import('@strudel.cycles/core'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/midi'),
    import('@strudel.cycles/xen'),
    import('@strudel.cycles/webaudio'),
    import('@strudel.cycles/osc'),
    import('@strudel.cycles/csound'),
    import('@strudel.cycles/soundfonts'),
  );
}

if (typeof window !== 'undefined') {
  initAudioOnFirstClick();
  prebake();
}

export function MiniRepl({
  tune,
  drawTime,
  punchcard,
  span = [0, 4],
  canvasHeight = 100,
  hideHeader,
  claviature,
  claviatureLabels,
}) {
  const [Repl, setRepl] = useState();
  const { theme, keybindings, fontSize, fontFamily } = useSettings();
  const [activeNotes, setActiveNotes] = useState([]);
  useEffect(() => {
    // we have to load this package on the client
    // because codemirror throws an error on the server
    Promise.all([import('@strudel.cycles/react'), modules])
      .then(([res]) => setRepl(() => res.MiniRepl))
      .catch((err) => console.error(err));
  }, []);
  return Repl ? (
    <div className="mb-4">
      <Repl
        tune={tune}
        hideOutsideView={true}
        drawTime={claviature ? [0, 0] : drawTime}
        punchcard={punchcard}
        span={span}
        canvasHeight={canvasHeight}
        theme={themes[theme]}
        hideHeader={hideHeader}
        keybindings={keybindings}
        onPaint={
          claviature
            ? (ctx, time, haps, drawTime) => {
                const active = haps
                  .map((hap) => hap.value.note)
                  .filter(Boolean)
                  .map((n) => (typeof n === 'string' ? noteToMidi(n) : n));
                setActiveNotes(active);
              }
            : undefined
        }
      />
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
  ) : (
    <pre>{tune}</pre>
  );
}
