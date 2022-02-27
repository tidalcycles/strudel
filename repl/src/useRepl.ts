import { useCallback, useState, useMemo } from 'react';
import { isNote } from 'tone';
import { fromMidi } from '../../util.mjs';
import { evaluate } from './evaluate';
import type { Pattern } from './types';
import useCycle from './useCycle';
import usePostMessage from './usePostMessage';

let s4 = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};

function useRepl({ tune, defaultSynth, autolink = true, onEvent, onDraw }: any) {
  const id = useMemo(() => s4(), []);
  const [code, setCode] = useState<string>(tune);
  const [activeCode, setActiveCode] = useState<string>();
  const [log, setLog] = useState('');
  const [error, setError] = useState<Error>();
  const [pending, setPending] = useState(false);
  const [hash, setHash] = useState('');
  const [pattern, setPattern] = useState<Pattern>();
  const dirty = code !== activeCode || error;
  const generateHash = () => encodeURIComponent(btoa(code));
  const activateCode = async (_code = code) => {
    if (activeCode && !dirty) {
      setError(undefined);
      !cycle.started && cycle.start();
      return;
    }
    try {
      setPending(true);
      const parsed = await evaluate(_code);
      !cycle.started && cycle.start();
      broadcast({ type: 'start', from: id });
      setPattern(() => parsed.pattern);
      if (autolink) {
        window.location.hash = '#' + encodeURIComponent(btoa(code));
      }
      setHash(generateHash());
      setError(undefined);
      setActiveCode(_code);
      setPending(false);
    } catch (err: any) {
      err.message = 'evaluation error: ' + err.message;
      console.warn(err);
      setError(err);
    }
  };
  const pushLog = (message: string) => setLog((log) => log + `${log ? '\n\n' : ''}${message}`);
  // logs events of cycle
  const logCycle = (_events: any, cycle: any) => {
    if (_events.length) {
      // pushLog(`# cycle ${cycle}\n` + _events.map((e: any) => e.show()).join('\n'));
    }
  };
  // cycle hook to control scheduling
  const cycle = useCycle({
    onDraw,
    onEvent: useCallback(
      (time, event) => {
        try {
          onEvent?.(event);
          const { onTrigger } = event.context;
          if (!onTrigger) {
            let note = event.value;
            // if value is number => interpret as midi number...
            // TODO: what if value is meant as frequency? => check context
            if (typeof event.value === 'number') {
              note = fromMidi(event.value);
            } else if (!isNote(note)) {
              throw new Error('not a note: ' + note);
            }
            if (defaultSynth) {
              defaultSynth.triggerAttackRelease(note, event.duration, time);
            } else {
              throw new Error('no defaultSynth passed to useRepl.');
            }
            /* console.warn('no instrument chosen', event);
          throw new Error(`no instrument chosen for ${JSON.stringify(event)}`); */
          } else {
            onTrigger(time, event);
          }
        } catch (err: any) {
          console.warn(err);
          err.message = 'unplayable event: ' + err?.message;
          pushLog(err.message); // not with setError, because then we would have to setError(undefined) on next playable event
        }
      },
      [onEvent]
    ),
    onQuery: useCallback(
      (state) => {
        try {
          return pattern?.query(state) || [];
        } catch (err: any) {
          console.warn(err);
          err.message = 'query error: ' + err.message;
          setError(err);
          return [];
        }
      },
      [pattern]
    ),
    onSchedule: useCallback((_events, cycle) => logCycle(_events, cycle), [pattern]),
    ready: !!pattern,
  });

  const broadcast = usePostMessage(({ data: { from, type } }) => {
    if (type === 'start' && from !== id) {
      // console.log('message', from, type);
      cycle.setStarted(false);
      setActiveCode(undefined);
    }
  });

  // set active pattern on ctrl+enter
  /* useLayoutEffect(() => {
    // TODO: make sure this is only fired when editor has focus
    const handleKeyPress = (e: any) => {
      if (e.ctrlKey || e.altKey) {
        switch (e.code) {
          case 'Enter':
            activateCode();
            !cycle.started && cycle.start();
            break;
          case 'Period':
            cycle.stop();
        }
      }
    };
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [pattern, code]); */

  /* useWebMidi({
    ready: useCallback(({ outputs }) => {
      pushLog(`WebMidi ready! Just add .midi(${outputs.map((o) => `'${o.name}'`).join(' | ')}) to the pattern. `);
    }, []),
    connected: useCallback(({ outputs }) => {
      pushLog(`Midi device connected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`);
    }, []),
    disconnected: useCallback(({ outputs }) => {
      pushLog(`Midi device disconnected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`);
    }, []),
  }); */

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
