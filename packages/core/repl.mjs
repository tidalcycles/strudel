import { NeoCyclist } from './neocyclist.mjs';
import { Cyclist } from './cyclist.mjs';
import { evaluate as _evaluate } from './evaluate.mjs';
import { logger } from './logger.mjs';
import { setTime } from './time.mjs';
import { evalScope } from './evaluate.mjs';
import { register, Pattern, isPattern, silence, stack } from './pattern.mjs';

export function repl({
  defaultOutput,
  onEvalError,
  beforeEval,
  beforeStart,
  afterEval,
  getTime,
  transpiler,
  onToggle,
  editPattern,
  onUpdateState,
  sync = false,
  setInterval,
  clearInterval,
  id,
}) {
  const state = {
    schedulerError: undefined,
    evalError: undefined,
    code: '// LOADING',
    activeCode: '// LOADING',
    pattern: undefined,
    miniLocations: [],
    widgets: [],
    pending: false,
    started: false,
  };

  const transpilerOptions = {
    id,
  };

  const updateState = (update) => {
    Object.assign(state, update);
    state.isDirty = state.code !== state.activeCode;
    state.error = state.evalError || state.schedulerError;
    onUpdateState?.(state);
  };

  const schedulerOptions = {
    onTrigger: getTrigger({ defaultOutput, getTime }),
    getTime,
    onToggle: (started) => {
      updateState({ started });
      onToggle?.(started);
    },
    setInterval,
    clearInterval,
    beforeStart,
  };

  // NeoCyclist uses a shared worker to communicate between instances, which is not supported on mobile chrome
  const scheduler =
    sync && typeof SharedWorker != 'undefined' ? new NeoCyclist(schedulerOptions) : new Cyclist(schedulerOptions);
  let pPatterns = {};
  let anonymousIndex = 0;
  let allTransform;

  const hush = function () {
    pPatterns = {};
    anonymousIndex = 0;
    allTransform = undefined;
    return silence;
  };

  const setPattern = async (pattern, autostart = true) => {
    pattern = editPattern?.(pattern) || pattern;
    await scheduler.setPattern(pattern, autostart);
    return pattern;
  };
  setTime(() => scheduler.now()); // TODO: refactor?

  const stop = () => scheduler.stop();
  const start = () => scheduler.start();
  const pause = () => scheduler.pause();
  const toggle = () => scheduler.toggle();
  const setCps = (cps) => scheduler.setCps(cps);
  const setCpm = (cpm) => scheduler.setCps(cpm / 60);
  const all = function (transform) {
    allTransform = transform;
    return silence;
  };

  // set pattern methods that use this repl via closure
  const injectPatternMethods = () => {
    Pattern.prototype.p = function (id) {
      if (id.startsWith('_') || id.endsWith('_')) {
        // allows muting a pattern x with x_ or _x
        return silence;
      }
      if (id === '$') {
        // allows adding anonymous patterns with $:
        id = `$${anonymousIndex}`;
        anonymousIndex++;
      }
      pPatterns[id] = this;
      return this;
    };
    Pattern.prototype.q = function (id) {
      return silence;
    };
    try {
      for (let i = 1; i < 10; ++i) {
        Object.defineProperty(Pattern.prototype, `d${i}`, {
          get() {
            return this.p(i);
          },
          configurable: true,
        });
        Object.defineProperty(Pattern.prototype, `p${i}`, {
          get() {
            return this.p(i);
          },
          configurable: true,
        });
        Pattern.prototype[`q${i}`] = silence;
      }
    } catch (err) {
      console.warn('injectPatternMethods: error:', err);
    }
    const cpm = register('cpm', function (cpm, pat) {
      return pat._fast(cpm / 60 / scheduler.cps);
    });
    return evalScope({
      all,
      hush,
      cpm,
      setCps,
      setcps: setCps,
      setCpm,
      setcpm: setCpm,
    });
  };

  const evaluate = async (code, autostart = true, shouldHush = true) => {
    if (!code) {
      throw new Error('no code to evaluate');
    }
    try {
      updateState({ code, pending: true });
      await injectPatternMethods();
      setTime(() => scheduler.now()); // TODO: refactor?
      await beforeEval?.({ code });
      shouldHush && hush();
      let { pattern, meta } = await _evaluate(code, transpiler, transpilerOptions);
      if (Object.keys(pPatterns).length) {
        pattern = stack(...Object.values(pPatterns));
      }
      if (allTransform) {
        pattern = allTransform(pattern);
      }
      if (!isPattern(pattern)) {
        const message = `got "${typeof evaluated}" instead of pattern`;
        throw new Error(message + (typeof evaluated === 'function' ? ', did you forget to call a function?' : '.'));
      }
      logger(`[eval] code updated`);
      pattern = await setPattern(pattern, autostart);
      updateState({
        miniLocations: meta?.miniLocations || [],
        widgets: meta?.widgets || [],
        activeCode: code,
        pattern,
        evalError: undefined,
        schedulerError: undefined,
        pending: false,
      });
      afterEval?.({ code, pattern, meta });
      return pattern;
    } catch (err) {
      logger(`[eval] error: ${err.message}`, 'error');
      console.error(err);
      updateState({ evalError: err, pending: false });
      onEvalError?.(err);
    }
  };
  const setCode = (code) => updateState({ code });
  return { scheduler, evaluate, start, stop, pause, setCps, setPattern, setCode, toggle, state };
}

export const getTrigger =
  ({ getTime, defaultOutput }) =>
  async (hap, deadline, duration, cps, t) => {
    // TODO: get rid of deadline after https://github.com/tidalcycles/strudel/pull/1004
    try {
      if (!hap.context.onTrigger || !hap.context.dominantTrigger) {
        await defaultOutput(hap, deadline, duration, cps, t);
      }
      if (hap.context.onTrigger) {
        // call signature of output / onTrigger is different...
        await hap.context.onTrigger(getTime() + deadline, hap, getTime(), cps, t);
      }
    } catch (err) {
      logger(`[cyclist] error: ${err.message}`, 'error');
    }
  };
