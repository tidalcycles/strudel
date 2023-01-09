import { pianoroll } from '@strudel.cycles/core';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import React, { useLayoutEffect, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useInView } from 'react-hook-inview';
import 'tailwindcss/tailwind.css';
import cx from '../cx';
import useHighlighting from '../hooks/useHighlighting.mjs';
import usePatternFrame from '../hooks/usePatternFrame.mjs';
import useStrudel from '../hooks/useStrudel.mjs';
import CodeMirror6, { flash } from './CodeMirror6';
import { Icon } from './Icon';
import styles from './MiniRepl.module.css';
import './style.css';
import { logger } from '@strudel.cycles/core';

const getTime = () => getAudioContext().currentTime;

export function MiniRepl({ tune, hideOutsideView = false, enableKeyboard, withCanvas = false, canvasHeight = 200 }) {
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
    getTime,
    editPattern: (pat, id) => {
      return pat.withContext((ctx) => ({ ...ctx, id }));
    },
  });

  usePatternFrame({
    pattern,
    started: withCanvas && started,
    getTime: () => scheduler.now(),
    onDraw: (time, haps) => {
      const ctx = document.querySelector('#' + canvasId).getContext('2d');
      pianoroll({ ctx, time, haps, autorange: 1, fold: 1, playhead: 1 });
    },
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
      {withCanvas && (
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
        <div className="sc-bg-gray-800 sc-rounded-md sc-p-2">
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

// TODO: dedupe
function useEvent(name, onTrigger, useCapture = false) {
  useEffect(() => {
    document.addEventListener(name, onTrigger, useCapture);
    return () => {
      document.removeEventListener(name, onTrigger, useCapture);
    };
  }, [onTrigger]);
}
