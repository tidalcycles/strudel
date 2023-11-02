/* import { cleanupDraw, cleanupUi, repl, getDrawContext, silence } from '@strudel.cycles/core';
import { webaudioOutput, getAudioContext } from '@strudel.cycles/webaudio';
import { transpiler } from '@strudel.cycles/transpiler';
import { prebake } from './prebake.mjs';
import { atom } from 'nanostores';

export const $replstate = atom({
  schedulerError: undefined,
  evalError: undefined,
  code: '// LOADING',
  activeCode: '// LOADING',
  pattern: silence,
  miniLocations: [],
  widgets: [],
  pending: true,
});
export const setReplState = (key, value) => $replstate.set({ ...$replstate.get(), [key]: value });

let instance;
export function webrepl({ beforeEval, onEvalError, afterEval, editPattern } = {}) {
  if (instance) {
    // TODO: find way to attack hooks (beforeEval, ...) to existing instance
    // maybe use subscriber pattern
    return instance;
  }
  if (typeof window === 'undefined') {
    throw new Error('webrepl can only be created in a browser!');
  }
  const init = prebake(); // load modules + samples

  instance = repl({
    // interval,
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    onSchedulerError: (err) => setReplState('schedulerError', err),
    onEvalError: (err) => {
      setReplState('evalError', err);
      setReplState('pending', false);
      onEvalError?.(err);
    },
    drawContext: getDrawContext(),
    transpiler,
    editPattern,
    beforeEval: async ({ code }) => {
      setReplState('code', code);
      setReplState('pending', true);
      await init;
      await beforeEval?.();
      cleanupUi();
      cleanupDraw();
    },
    afterEval: async (res) => {
      const { pattern: _pattern, code, meta } = res;
      setReplState('miniLocations', meta?.miniLocations || []);
      setReplState('widgets', meta?.widgets || []);

      setReplState('activeCode', code);
      setReplState('pattern', _pattern);
      setReplState('evalError', undefined);
      setReplState('schedulerError', undefined);
      setReplState('pending', false);
      await afterEval?.(res);
    },
    onToggle: (started) => {
      setReplState('started', started);
      // this was so far only used in main repl...
      // is this also relevant for mini repl?
      if (!started) {
        cleanupDraw(false);
        window.postMessage('strudel-stop');
      } else {
        window.postMessage('strudel-start');
      }
    },
  });
  return instance;
}
 */