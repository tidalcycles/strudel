import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useInView } from 'react-hook-inview';
import cx from '../cx';
import useHighlighting from '../hooks/useHighlighting.mjs';
import CodeMirror6, { flash } from './CodeMirror6';
import 'tailwindcss/tailwind.css';
import './style.css';
import styles from './MiniRepl.module.css';
import { Icon } from './Icon';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import useStrudel from '../hooks/useStrudel.mjs';

const getTime = () => getAudioContext().currentTime;

export function MiniRepl({ tune, hideOutsideView = false, init, enableKeyboard }) {
  const {
    code,
    setCode,
    evaluate,
    activateCode,
    error,
    isDirty,
    activeCode,
    pattern,
    started,
    scheduler,
    togglePlay,
    stop,
  } = useStrudel({
    initialCode: tune,
    defaultOutput: webaudioOutput,
    getTime,
  });
  /*   useEffect(() => {
    init && activateCode();
  }, [init, activateCode]); */
  const [view, setView] = useState();
  const [ref, isVisible] = useInView({
    threshold: 0.01,
  });
  const wasVisible = useRef();
  const show = useMemo(() => {
    if (isVisible || !hideOutsideView) {
      wasVisible.current = true;
    }
    return isVisible || wasVisible.current;
  }, [isVisible, hideOutsideView]);
  useHighlighting({
    view,
    pattern,
    active: started && !activeCode?.includes('strudel disable-highlighting'),
    getTime: () => scheduler.getPhase(),
  });

  // set active pattern on ctrl+enter
  useLayoutEffect(() => {
    if (enableKeyboard) {
      const handleKeyPress = async (e) => {
        if (e.ctrlKey || e.altKey) {
          if (e.code === 'Enter') {
            e.preventDefault();
            flash(view);
            await activateCode();
          } else if (e.code === 'Period') {
            stop();
            e.preventDefault();
          }
        }
      };
      window.addEventListener('keydown', handleKeyPress, true);
      return () => window.removeEventListener('keydown', handleKeyPress, true);
    }
  }, [enableKeyboard, pattern, code, evaluate, stop, view]);

  return (
    <div className={styles.container} ref={ref}>
      <div className={styles.header}>
        <div className={styles.buttons}>
          <button className={cx(styles.button, started ? 'sc-animate-pulse' : '')} onClick={() => togglePlay()}>
            <Icon type={started ? 'pause' : 'play'} />
          </button>
          <button className={cx(isDirty ? styles.button : styles.buttonDisabled)} onClick={() => activateCode()}>
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
