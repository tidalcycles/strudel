import { evalScope, controls } from '@strudel.cycles/core';
import { initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import { MiniRepl as _MiniRepl } from '@strudel.cycles/react';
import { prebake } from './prebake';
//import { themes } from '../repl/themes.mjs';
// import { useSettings } from '../settings.mjs';

if (typeof window !== 'undefined') {
  await evalScope(
    controls,
    import('@strudel.cycles/core'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/webaudio'),
    import('@strudel.cycles/soundfonts'),
  );
}

if (typeof window !== 'undefined') {
  initAudioOnFirstClick();
  prebake();
}

export function SlideRepl({ tune, drawTime, punchcard, canvasHeight = 100 }) {
  // const { theme } = useSettings();
  return (
    <div className="mb-4">
      <_MiniRepl
        tune={tune}
        hideOutsideView={true}
        drawTime={drawTime}
        punchcard={punchcard}
        canvasHeight={canvasHeight}
        fontSize={32}
        // theme={themes[theme]}
      />
    </div>
  );
}
