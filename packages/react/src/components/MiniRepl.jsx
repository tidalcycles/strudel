import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import React, { useLayoutEffect, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useInView } from 'react-hook-inview';
import 'tailwindcss/tailwind.css';
import cx from '../cx';
import useHighlighting from '../hooks/useHighlighting.mjs';
import useStrudel from '../hooks/useStrudel.mjs';
import CodeMirror6, { flash } from './CodeMirror6';
import { Icon } from './Icon';
import styles from './MiniRepl.module.css';
import './style.css';
import { logger } from '@strudel.cycles/core';
import useEvent from '../hooks/useEvent.mjs';
import useKeydown from '../hooks/useKeydown.mjs';

const getTime = () => getAudioContext().currentTime;

export function MiniRepl({
  tune,
  hideOutsideView = false,
  enableKeyboard,
  drawTime,
  punchcard,
  canvasHeight = 200,
  theme,
}) {
  drawTime = drawTime || (punchcard ? [0, 4] : undefined);
  const evalOnMount = !!drawTime;
  const drawContext = useCallback(
    !!drawTime ? (canvasId) => document.querySelector('#' + canvasId)?.getContext('2d') : null,
    [drawTime],
  );
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
    canvasId,
    id: replId,
  } = useStrudel({
    initialCode: tune,
    defaultOutput: webaudioOutput,
    editPattern: (pat) => (punchcard ? pat.punchcard() : pat),
    getTime,
    evalOnMount,
    drawContext,
    drawTime,
  });

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
    getTime: () => scheduler.now(),
  });

  // keyboard shortcuts
  useKeydown(
    useCallback(
      async (e) => {
        if (view?.hasFocus) {
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
        }
      },
      [activateCode, stop, view],
    ),
  );

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

  const [log, setLog] = useState([]);
  useLogger(
    useCallback((e) => {
      const { data } = e.detail;
      const logId = data?.hap?.context?.id;
      // const logId = data?.pattern?.meta?.id;
      if (logId === replId) {
        setLog((l) => {
          return l.concat([e.detail]).slice(-10);
        });
      }
    }, []),
  );

  return (
    <div className={styles.container} ref={ref}>
      <div className={styles.header}>
        <div className={styles.buttons}>
          <button className={cx(styles.button, started ? 'animate-pulse' : '')} onClick={() => togglePlay()}>
            <Icon type={started ? 'stop' : 'play'} />
          </button>
          <button className={cx(isDirty ? styles.button : styles.buttonDisabled)} onClick={() => activateCode()}>
            <Icon type="refresh" />
          </button>
        </div>
        {error && <div className={styles.error}>{error.message}</div>}
      </div>
      <div className={styles.body}>
        {show && <CodeMirror6 value={code} onChange={setCode} onViewChanged={setView} theme={theme} />}
      </div>
      {drawTime && (
        <canvas
          id={canvasId}
          className="w-full pointer-events-none"
          height={canvasHeight}
          ref={(el) => {
            if (el && el.width !== el.clientWidth) {
              el.width = el.clientWidth;
            }
          }}
        ></canvas>
      )}
      {!!log.length && (
        <div className="bg-gray-800 rounded-md p-2">
          {log.map(({ message }, i) => (
            <div key={i}>{message}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// TODO: dedupe
function useLogger(onTrigger) {
  useEvent(logger.key, onTrigger);
}
