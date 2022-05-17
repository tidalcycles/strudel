import React, { useState, useMemo, useRef } from 'react';
import { useInView } from 'react-hook-inview';

import useRepl from '../hooks/useRepl.mjs';
import cx from '../cx';
import useHighlighting from '../hooks/useHighlighting.mjs';
import CodeMirror6 from './CodeMirror6';
import 'tailwindcss/tailwind.css';
import styles from './MiniRepl.module.css';
import { Icon } from './Icon';

import { Tone } from '@strudel.cycles/tone';
import { evalScope } from '@strudel.cycles/eval';
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

export function MiniRepl({ tune }) {
  const { code, setCode, pattern, activateCode, error, cycle, dirty, togglePlay } = useRepl({
    tune,
    defaultSynth,
    autolink: false,
  });
  const [view, setView] = useState();
  const [ref, isVisible] = useInView({
    threshold: 0.01,
  });
  const wasVisible = useRef();
  const show = useMemo(() => {
    if (isVisible) {
      wasVisible.current = true;
    }
    return isVisible || wasVisible.current;
  }, [isVisible]);
  useHighlighting({ view, pattern, active: cycle.started });
  return (
    <div className={styles.container} ref={ref}>
      <div className={styles.header}>
        <div className={styles.buttons}>
          <button className={cx(styles.button, cycle.started ? 'sc-animate-pulse' : '')} onClick={() => togglePlay()}>
            <Icon type={cycle.started ? 'pause' : 'play'} />
          </button>
          <button className={cx(dirty ? styles.button : styles.buttonDisabled)} onClick={() => activateCode()}>
            <Icon type="refresh" />
          </button>
        </div>
        {error && <div className={styles.error}>{error.message}</div>}
      </div>
      <div className={styles.body}>
        {show && <CodeMirror6 value={code} onChange={setCode} onViewChanged={setView} />}
      </div>
    </div>
  );
}
