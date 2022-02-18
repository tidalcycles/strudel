import { useCallback, useLayoutEffect, useState, useMemo, useEffect } from 'react';
import { isNote } from 'tone';
import { evaluate } from './evaluate';
import { useWebMidi } from './midi';
import type { Pattern } from './types';
import useCycle from './useCycle';
import usePostMessage from './usePostMessage';

let s4 = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};

function useRepl({ tune, defaultSynth }) {
  const id = useMemo(() => s4(), []);
  const [code, setCode] = useState<string>(tune);
  const [activeCode, setActiveCode] = useState<string>();
  const [log, setLog] = useState('');
  const [error, setError] = useState<Error>();
  const [pattern, setPattern] = useState<Pattern>();
  const dirty = code !== activeCode;
  const activateCode = (_code = code) => {
    !cycle.started && cycle.start();
    broadcast({ type: 'start', from: id });
    if (activeCode && !dirty) {
      setError(undefined);
      return;
    }
    try {
      const parsed = evaluate(_code);
      setPattern(() => parsed.pattern);
      window.location.hash = '#' + encodeURIComponent(btoa(code));
      setError(undefined);
      setActiveCode(_code);
    } catch (err: any) {
      setError(err);
    }
  };
  const pushLog = (message: string) => setLog((log) => log + `${log ? '\n\n' : ''}${message}`);
  // logs events of cycle
  const logCycle = (_events: any, cycle: any) => {
    if (_events.length) {
      pushLog(`# cycle ${cycle}\n` + _events.map((e: any) => e.show()).join('\n'));
    }
  };
  // cycle hook to control scheduling
  const cycle = useCycle({
    onEvent: useCallback((time, event) => {
      try {
        if (!event.value?.onTrigger) {
          const note = event.value?.value || event.value;
          if (!isNote(note)) {
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
          const { onTrigger } = event.value;
          onTrigger(time, event);
        }
      } catch (err: any) {
        console.warn(err);
        err.message = 'unplayable event: ' + err?.message;
        pushLog(err.message); // not with setError, because then we would have to setError(undefined) on next playable event
      }
    }, []),
    onQuery: useCallback(
      (span) => {
        try {
          return pattern?.query(span) || [];
        } catch (err: any) {
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
  useLayoutEffect(() => {
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
  }, [pattern, code]);

  useWebMidi({
    ready: useCallback(({ outputs }) => {
      pushLog(`WebMidi ready! Just add .midi(${outputs.map((o) => `"${o.name}"`).join(' | ')}) to the pattern. `);
    }, []),
    connected: useCallback(({ outputs }) => {
      pushLog(`Midi device connected! Available: ${outputs.map((o) => `"${o.name}"`).join(', ')}`);
    }, []),
    disconnected: useCallback(({ outputs }) => {
      pushLog(`Midi device disconnected! Available: ${outputs.map((o) => `"${o.name}"`).join(', ')}`);
    }, []),
  });

  const togglePlay = () => {
    if (!cycle.started) {
      activateCode();
    } else {
      cycle.stop();
    }
  };

  return { code, setCode, pattern, error, cycle, setPattern, dirty, log, togglePlay };
}

export default useRepl;
