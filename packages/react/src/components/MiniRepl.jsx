import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useInView } from 'react-hook-inview';
import useRepl from '../hooks/useRepl.mjs';
import cx from '../cx';
import useHighlighting from '../hooks/useHighlighting.mjs';
import CodeMirror6, { flash } from './CodeMirror6';
import 'tailwindcss/tailwind.css';
import './style.css';
import styles from './MiniRepl.module.css';
import { Icon } from './Icon';

export function MiniRepl({ tune, defaultSynth, hideOutsideView = false, theme, init, onEvent, enableKeyboard }) {
  const { code, setCode, pattern, activeCode, activateCode, evaluateOnly, error, cycle, dirty, togglePlay, stop } =
    useRepl({
      tune,
      defaultSynth,
      autolink: false,
      onEvent,
    });
  useEffect(() => {
    init && evaluateOnly();
  }, [tune, init]);
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
  useHighlighting({ view, pattern, active: cycle.started && !activeCode?.includes('strudel disable-highlighting') });

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
            cycle.stop();
            e.preventDefault();
          }
        }
      };
      window.addEventListener('keydown', handleKeyPress, true);
      return () => window.removeEventListener('keydown', handleKeyPress, true);
    }
  }, [enableKeyboard, pattern, code, activateCode, cycle, view]);

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
