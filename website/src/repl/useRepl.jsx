import { useStore } from '@nanostores/react';
import { webrepl, $replstate, setReplState } from './webrepl.mjs';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useHighlighting, flash, usePatternFrame } from '@strudel.cycles/react';
import { getAudioContext } from '@strudel.cycles/webaudio';
import { useSettings } from '../settings.mjs';
import { themes } from './themes.mjs';
import { updateWidgets } from '@strudel/codemirror';
import { getDrawContext } from '@strudel.cycles/core';

export function useRepl({
  drawContext = getDrawContext(),
  editPattern,
  evalOnMount = false,
  canvasId,
  drawTime = [-2, 2],
  afterEval,
} = {}) {
  const [view, setView] = useState(); // codemirror view
  const handleViewChanged = useCallback((v) => setView(v), []);
  const setCode = (code) => setReplState('code', code);
  const setPending = (pending) => setReplState('pending', pending);
  const handleChangeCode = useCallback((c) => setReplState('code', c), []); // [started] ?
  // const handleSelectionChange = useCallback((selection) => {}, []);
  // onSelectionChange={handleSelectionChange}

  const repl = webrepl({ editPattern, afterEval });
  const { evaluate, stop, scheduler } = repl;
  const { schedulerError, evalError, code, started, pattern, miniLocations, activeCode, widgets, pending } =
    useStore($replstate);
  const error = schedulerError || evalError;
  const settings = useSettings();
  const {
    theme,
    keybindings,
    fontSize,
    fontFamily,
    isLineNumbersDisplayed,
    isAutoCompletionEnabled,
    isLineWrappingEnabled,
    panelPosition,
    isZen,
  } = settings;

  // very ugly draw logic
  const shouldPaint = useCallback((pat) => !!pat?.context?.onPaint, []);
  const paintOptions = useMemo(() => ({ fontFamily }), [fontFamily]);
  const id = useMemo(() => s4(), []);
  canvasId = canvasId || `canvas-${id}`; // draw logic
  const onDraw = useCallback(
    (pattern, time, haps, drawTime) => {
      const { onPaint } = pattern.context || {};
      const ctx = typeof drawContext === 'function' ? drawContext(canvasId) : drawContext;
      onPaint?.(ctx, time, haps, drawTime, paintOptions);
    },
    [drawContext, canvasId, paintOptions],
  );
  const drawFirstFrame = useCallback(
    (pat) => {
      if (shouldPaint(pat)) {
        const [_, lookahead] = drawTime;
        const haps = pat.queryArc(0, lookahead);
        // draw at -0.001 to avoid activating haps at 0
        onDraw(pat, -0.001, haps, drawTime);
      }
    },
    [drawTime, onDraw, shouldPaint],
  );
  const inited = useRef();
  useEffect(() => {
    if (!inited.current && evalOnMount && code) {
      inited.current = true;
      evaluate(code, false).then((pat) => drawFirstFrame(pat));
    }
  }, [evalOnMount, code, evaluate, drawFirstFrame]);
  usePatternFrame({
    pattern,
    started: shouldPaint(pattern) && started,
    getTime: () => scheduler.now(),
    drawTime,
    onDraw,
  });
  //

  const currentTheme = useMemo(() => themes[theme] || themes.strudelTheme, [theme]);
  const isDirty = code !== activeCode;
  // highlighting => should probably also just live outside of react...
  const { setMiniLocations } = useHighlighting({
    view,
    pattern,
    active: started && !activeCode?.includes('strudel disable-highlighting'),
    getTime: () => scheduler.now(),
  });

  useEffect(() => {
    if (view) {
      updateWidgets(view, widgets);
    }
  }, [view, widgets]);

  useEffect(() => {
    setMiniLocations(miniLocations);
  }, [miniLocations]);

  const activateCode = useCallback(
    async (autostart = true) => {
      const res = await evaluate(code, autostart);
      // broadcast({ type: 'start', from: id });
      return res;
    },
    [evaluate, code],
  );

  // Codemirror hooks
  const onEvaluate = () => {
    if (getAudioContext().state !== 'running') {
      alert('please click play to initialize the audio. you can use shortcuts after that!');
      return;
    }
    flash(view);
    activateCode();
  };
  const onReEvaluate = () => {
    stop();
    panic();
    activateCode();
  };
  const onPanic = () => {
    stop();
    panic();
  };
  const onStop = () => stop();

  const codemirror = {
    theme: currentTheme,
    value: code,
    keybindings: keybindings,
    isLineNumbersDisplayed: isLineNumbersDisplayed,
    isAutoCompletionEnabled: isAutoCompletionEnabled,
    isLineWrappingEnabled: isLineWrappingEnabled,
    fontSize: fontSize,
    fontFamily: fontFamily,
    onChange: handleChangeCode,
    onViewChanged: handleViewChanged,
    onEvaluate: onEvaluate,
    onReEvaluate: onReEvaluate,
    onPanic: onPanic,
    onStop: onStop,
  };

  return {
    code,
    setCode,
    scheduler,
    evaluate,
    activateCode,
    isDirty,
    activeCode,
    pattern,
    started,
    stop,
    error,
    widgets,
    pending,
    setPending,
    codemirror,
  };
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}
