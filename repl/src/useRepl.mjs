import { useCallback, useState, useMemo } from 'react';
import { evaluate } from '@strudel.cycles/eval';
import { getPlayableNoteValue } from '@strudel.cycles/core/util.mjs';
import useCycle from './useCycle.mjs';
import usePostMessage from './usePostMessage.mjs';

let s4 = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};
const generateHash = (code) => encodeURIComponent(btoa(code));

function useRepl({ tune, defaultSynth, autolink = true, onEvent, onDraw }) {
  const id = useMemo(() => s4(), []);
  const [code, setCode] = useState(tune);
  const [activeCode, setActiveCode] = useState();
  const [log, setLog] = useState('');
  const [error, setError] = useState();
  const [pending, setPending] = useState(false);
  const [hash, setHash] = useState('');
  const [pattern, setPattern] = useState();
  const dirty = useMemo(() => code !== activeCode || error, [code, activeCode, error]);
  const pushLog = useCallback((message) => setLog((log) => log + `${log ? '\n\n' : ''}${message}`), []);

  // below block allows disabling the highlighting by including "strudel disable-highlighting" in the code (as comment)
  onDraw = useMemo(() => {
    if (activeCode && !activeCode.includes('strudel disable-highlighting')) {
      return onDraw;
    }
  }, [activeCode, onDraw]);
  
  // cycle hook to control scheduling
  const cycle = useCycle({
    onDraw,
    onEvent: useCallback(
      (time, event, currentTime) => {
        try {
          onEvent?.(event);
          const { onTrigger, velocity } = event.context;
          if (!onTrigger) {
            if (defaultSynth) {
              const note = getPlayableNoteValue(event);
              defaultSynth.triggerAttackRelease(note, event.duration, time, velocity);
            } else {
              throw new Error('no defaultSynth passed to useRepl.');
            }
            /* console.warn('no instrument chosen', event);
          throw new Error(`no instrument chosen for ${JSON.stringify(event)}`); */
          } else {
            onTrigger(time, event, currentTime);
          }
        } catch (err) {
          console.warn(err);
          err.message = 'unplayable event: ' + err?.message;
          pushLog(err.message); // not with setError, because then we would have to setError(undefined) on next playable event
        }
      },
      [onEvent, pushLog, defaultSynth],
    ),
    onQuery: useCallback(
      (state) => {
        try {
          return pattern?.query(state) || [];
        } catch (err) {
          console.warn(err);
          err.message = 'query error: ' + err.message;
          setError(err);
          return [];
        }
      },
      [pattern],
    ),
    onSchedule: useCallback((_events, cycle) => logCycle(_events, cycle), []),
    ready: !!pattern && !!activeCode,
  });

  const broadcast = usePostMessage(({ data: { from, type } }) => {
    if (type === 'start' && from !== id) {
      // console.log('message', from, type);
      cycle.setStarted(false);
      setActiveCode(undefined);
    }
  });

  const activateCode = useCallback(
    async (_code = code) => {
      if (activeCode && !dirty) {
        setError(undefined);
        cycle.start();
        return;
      }
      try {
        setPending(true);
        const parsed = await evaluate(_code);
        cycle.start();
        broadcast({ type: 'start', from: id });
        setPattern(() => parsed.pattern);
        if (autolink) {
          window.location.hash = '#' + encodeURIComponent(btoa(code));
        }
        setHash(generateHash(code));
        setError(undefined);
        setActiveCode(_code);
        setPending(false);
      } catch (err) {
        err.message = 'evaluation error: ' + err.message;
        console.warn(err);
        setError(err);
      }
    },
    [activeCode, dirty, code, cycle, autolink, id, broadcast],
  );
  // logs events of cycle
  const logCycle = (_events, cycle) => {
    if (_events.length) {
      // pushLog(`# cycle ${cycle}\n` + _events.map((e: any) => e.show()).join('\n'));
    }
  };

  const togglePlay = () => {
    if (!cycle.started) {
      activateCode();
    } else {
      cycle.stop();
    }
  };

  return {
    pending,
    code,
    setCode,
    pattern,
    error,
    cycle,
    setPattern,
    dirty,
    log,
    togglePlay,
    activateCode,
    activeCode,
    pushLog,
    hash,
  };
}

export default useRepl;
