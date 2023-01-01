import { Cyclist } from './cyclist.mjs';
import { evaluate as _evaluate } from './evaluate.mjs';
import { logger } from './logger.mjs';
import { setTime } from './time.mjs';

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
}) {
  const scheduler = new Cyclist({
    interval,
    onTrigger: async (hap, deadline, duration) => {
      try {
        if (!hap.context.onTrigger || !hap.context.dominantTrigger) {
          await defaultOutput(hap, deadline, duration);
        }
        if (hap.context.onTrigger) {
          const cps = 1;
          // call signature of output / onTrigger is different...
          await hap.context.onTrigger(getTime() + deadline, hap, getTime(), cps);
        }
      } catch (err) {
        logger(`[cyclist] error: ${err.message}`, 'error');
      }
    },
    onError: onSchedulerError,
    getTime,
    onToggle,
  });
  setTime(() => scheduler.getPhase()); // TODO: refactor?
  const evaluate = async (code, autostart = true) => {
    if (!code) {
      throw new Error('no code to evaluate');
    }
    try {
      beforeEval?.({ code });
      const { pattern } = await _evaluate(code, transpiler);
      logger(`[eval] code updated`);
      scheduler.setPattern(pattern, autostart);
      afterEval?.({ code, pattern });
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
  return { scheduler, evaluate, start, stop, pause };
}
