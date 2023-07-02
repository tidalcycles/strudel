import { Cyclist } from './cyclist.mjs';
import { evaluate as _evaluate } from './evaluate.mjs';
import { logger } from './logger.mjs';
import { setTime } from './time.mjs';
import { evalScope } from './evaluate.mjs';
import { register } from './pattern.mjs';

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
    onToggle,
  });
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
      await beforeEval?.({ code });
      let { pattern, meta } = await _evaluate(code, transpiler);
      logger(`[eval] code updated`);
      setPattern(pattern, autostart);
      afterEval?.({ code, pattern, meta });
      return pattern;
    } catch (err) {
      // console.warn(`[repl] eval error: ${err.message}`);
      logger(`[eval] error: ${err.message}`, 'error');
      onEvalError?.(err);
    }
  };
  const stop = () => scheduler.stop();
  const start = () => scheduler.start();
  const pause = () => scheduler.pause();
  const setCps = (cps) => scheduler.setCps(cps);
  const setCpm = (cpm) => scheduler.setCps(cpm / 60);

  // the following functions use the cps value, which is why they are defined here..
  const loopAt = register('loopAt', (cycles, pat) => {
    return pat.loopAtCps(cycles, scheduler.cps);
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
    setCps,
    setcps: setCps,
    setCpm,
    setcpm: setCpm,
  });

  return { scheduler, evaluate, start, stop, pause, setCps, setPattern };
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
