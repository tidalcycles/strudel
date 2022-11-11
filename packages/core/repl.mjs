import { Cyclist } from './cyclist.mjs';
import { evaluate as _evaluate } from './evaluate.mjs';

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
  onLog,
}) {
  const scheduler = new Cyclist({
    interval,
    onTrigger: (hap, deadline, duration) => {
      if (!hap.context.onTrigger) {
        return defaultOutput(hap, deadline, duration);
      }
      const cps = 1; // TODO: fix
      // call signature of output / onTrigger is different...
      return hap.context.onTrigger(getTime() + deadline, hap, getTime(), cps);
    },
    onError: onSchedulerError,
    getTime,
    onToggle,
    onLog: (message) => onLog?.(`[clock] ${message}`),
  });
  const evaluate = async (code, autostart = true) => {
    if (!code) {
      throw new Error('no code to evaluate');
    }
    try {
      beforeEval({ code });
      const { pattern } = await _evaluate(code, transpiler);
      onLog?.(`[eval] code updated`);
      scheduler.setPattern(pattern, autostart);
      afterEval({ code, pattern });
      return pattern;
    } catch (err) {
      // console.warn(`[repl] eval error: ${err.message}`);
      onLog?.(`[eval] error: ${err.message}`, 'error');
      onEvalError?.(err);
    }
  };
  const stop = () => scheduler.stop();
  const start = () => scheduler.start();
  const pause = () => scheduler.pause();
  return { scheduler, evaluate, start, stop, pause };
}
