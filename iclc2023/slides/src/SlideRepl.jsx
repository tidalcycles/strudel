import { evalScope, controls } from '@strudel.cycles/core';
import { initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import { MiniRepl as _MiniRepl } from '@strudel.cycles/react';
import { prebake } from './prebake';
import { atomone } from '@uiw/codemirror-themes-all';

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

export function SlideRepl({ tune, drawTime, punchcard, canvasHeight = 100, hideHeader = false }) {
  // const { theme } = useSettings();
  return (
    <div className="mb-4">
      <_MiniRepl
        hideHeader={hideHeader}
        tune={tune}
        hideOutsideView={true}
        drawTime={drawTime}
        punchcard={punchcard}
        canvasHeight={canvasHeight}
        fontSize={32}
        theme={atomone}
        // theme={themes[theme]}
      />
    </div>
  );
}
