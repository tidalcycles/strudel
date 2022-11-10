import { Cyclist } from './cyclist.mjs';
import { evaluate as _evaluate } from './evaluate.mjs';

export function repl({
  interval,
  defaultOutput,
  onSchedulerError,
  onEvalError,
  onEval,
  getTime,
  transpiler,
  onToggle,
}) {
  const scheduler = new Cyclist({ interval, onTrigger: defaultOutput, onError: onSchedulerError, getTime, onToggle });
  const evaluate = async (code) => {
    if (!code) {
      throw new Error('no code to evaluate');
    }
    try {
      const { pattern } = await _evaluate(code, transpiler);
      scheduler.setPattern(pattern, true);
      onEval?.({
        pattern,
        code,
      });
    } catch (err) {
      console.warn(`eval error: ${err.message}`);
      onEvalError?.(err);
    }
  };
  return { scheduler, evaluate };
}
