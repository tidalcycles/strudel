import { Cyclist } from './cyclist.mjs';
import { evaluate as _evaluate } from './evaluate.mjs';
import { logger } from './logger.mjs';
import { setTime } from './time.mjs';
import { evalScope } from './evaluate.mjs';
import { register } from './pattern.mjs';
import { atom, computed } from 'nanostores';

export const $replstate = atom({
  schedulerError: undefined,
  evalError: undefined,
  code: '// LOADING',
  activeCode: '// LOADING',
  pattern: undefined,
  miniLocations: [],
  widgets: [],
  pending: true,
  started: false,
});
export const $repldirty = computed($replstate, (s) => s.code !== s.activeCode);

export const setReplState = (key, value) => $replstate.set({ ...$replstate.get(), [key]: value });

export function repl({
  interval,
  defaultOutput,
  onSchedulerError,
  onEvalError,
  beforeEval,
  afterEval,
  getTime,
  transpiler,
  onToggle,
  editPattern,
}) {
  const scheduler = new Cyclist({
    interval,
    onTrigger: getTrigger({ defaultOutput, getTime }),
    onError: onSchedulerError,
    getTime,
    onToggle: (started) => {
      setReplState('started', started);
      onToggle?.(started);
    },
  });
  let playPatterns = [];
  const setPattern = (pattern, autostart = true) => {
    pattern = editPattern?.(pattern) || pattern;
    scheduler.setPattern(pattern, autostart);
  };
  setTime(() => scheduler.now()); // TODO: refactor?
  const evaluate = async (code, autostart = true) => {
    if (!code) {
      throw new Error('no code to evaluate');
    }
    try {
      setReplState('code', code);
      setReplState('pending', true);
      await beforeEval?.({ code });
      playPatterns = [];
      let { pattern, meta } = await _evaluate(code, transpiler);
      if (playPatterns.length) {
        pattern = pattern.stack(...playPatterns);
      }
      logger(`[eval] code updated`);
      setPattern(pattern, autostart);
      setReplState('miniLocations', meta?.miniLocations || []);
      setReplState('widgets', meta?.widgets || []);
      setReplState('activeCode', code);
      setReplState('pattern', pattern);
      setReplState('evalError', undefined);
      setReplState('schedulerError', undefined);
      setReplState('pending', false);
      afterEval?.({ code, pattern, meta });
      return pattern;
    } catch (err) {
      // console.warn(`[repl] eval error: ${err.message}`);
      logger(`[eval] error: ${err.message}`, 'error');
      setReplState('evalError', err);
      setReplState('pending', false);
      onEvalError?.(err);
    }
  };
  const stop = () => scheduler.stop();
  const start = () => scheduler.start();
  const pause = () => scheduler.pause();
  const toggle = () => scheduler.toggle();
  const setCps = (cps) => scheduler.setCps(cps);
  const setCpm = (cpm) => scheduler.setCps(cpm / 60);

  // the following functions use the cps value, which is why they are defined here..
  const loopAt = register('loopAt', (cycles, pat) => {
    return pat.loopAtCps(cycles, scheduler.cps);
  });

  const play = register('play', (pat) => {
    playPatterns.push(pat);
    return pat;
  });

  const fit = register('fit', (pat) =>
    pat.withHap((hap) =>
      hap.withValue((v) => ({
        ...v,
        speed: scheduler.cps / hap.whole.duration, // overwrite speed completely?
        unit: 'c',
      })),
    ),
  );

  evalScope({
    loopAt,
    fit,
    play,
    setCps,
    setcps: setCps,
    setCpm,
    setcpm: setCpm,
  });

  const setCode = (c) => setReplState('code', c);
  return { scheduler, evaluate, start, stop, pause, setCps, setPattern, setCode, toggle };
}

export const getTrigger =
  ({ getTime, defaultOutput }) =>
  async (hap, deadline, duration, cps) => {
    try {
      if (!hap.context.onTrigger || !hap.context.dominantTrigger) {
        await defaultOutput(hap, deadline, duration, cps);
      }
      if (hap.context.onTrigger) {
        // call signature of output / onTrigger is different...
        await hap.context.onTrigger(getTime() + deadline, hap, getTime(), cps);
      }
    } catch (err) {
      logger(`[cyclist] error: ${err.message}`, 'error');
    }
  };
