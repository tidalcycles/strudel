import { noteToMidi } from '@strudel.cycles/core';
import { useEffect, useState } from 'react';
import { prebake } from '../repl/prebake';
import { themes } from '../repl/themes.mjs';
import './MiniRepl.css';
import { useSettings } from '../settings.mjs';
import Claviature from '@components/Claviature';

let init;
if (typeof window !== 'undefined') {
  init = prebake();
}

export function MiniRepl({
  tune,
  drawTime,
  punchcard,
  punchcardLabels = true,
  span = [0, 4],
  canvasHeight = 100,
  hideHeader,
  claviature,
  claviatureLabels,
}) {
  const [Repl, setRepl] = useState();
  const { theme, keybindings, fontSize, fontFamily, isLineNumbersDisplayed } = useSettings();
  const [activeNotes, setActiveNotes] = useState([]);
  useEffect(() => {
    // we have to load this package on the client
    // because codemirror throws an error on the server
    Promise.all([import('@strudel.cycles/react'), init])
      .then(([res]) => setRepl(() => res.MiniRepl))
      .catch((err) => console.error(err));
  }, []);
  return Repl ? (
    <div className="mb-4 mini-repl">
      <Repl
        tune={tune}
        hideOutsideView={true}
        drawTime={claviature ? [0, 0] : drawTime}
        punchcard={punchcard}
        punchcardLabels={punchcardLabels}
        span={span}
        canvasHeight={canvasHeight}
        theme={themes[theme]}
        hideHeader={hideHeader}
        keybindings={keybindings}
        fontFamily={fontFamily}
        fontSize={fontSize}
        isLineNumbersDisplayed={isLineNumbersDisplayed}
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
