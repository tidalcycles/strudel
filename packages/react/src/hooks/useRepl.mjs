/*
useRepl.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/useRepl.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { useCallback, useState, useMemo, useEffect } from 'react';
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

function useRepl({ tune, defaultSynth, autolink = true, onEvent, onDraw: onDrawProp }) {
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
  const onDraw = useMemo(() => {
    if (activeCode && !activeCode.includes('strudel disable-highlighting')) {
      return (time, event) => onDrawProp?.(time, event, activeCode);
    }
  }, [activeCode, onDrawProp]);

  // cycle hook to control scheduling
  const cycle = useCycle({
    onDraw,
    onEvent: useCallback(
      (time, event, currentTime) => {
        try {
          onEvent?.(event);
          if (event.context.logs?.length) {
            event.context.logs.forEach(pushLog);
          }
          const { onTrigger, velocity } = event.context;
          if (!onTrigger) {
            if (defaultSynth) {
              const note = getPlayableNoteValue(event);
              defaultSynth.triggerAttackRelease(note, event.duration.valueOf(), time, velocity);
            } else {
              throw new Error('no defaultSynth passed to useRepl.');
            }
            /* console.warn('no instrument chosen', event);
          throw new Error(`no instrument chosen for ${JSON.stringify(event)}`); */
          } else {
            onTrigger(
              time,
              event,
              currentTime,
              1 /* cps */,
              event.wholeOrPart().begin.valueOf(),
              event.duration.valueOf(),
            );
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
    async (_code = code, evaluateOnly = false) => {
      if (activeCode && !dirty) {
        setError(undefined);
        !evaluateOnly && cycle.start();
        return;
      }
      try {
        setPending(true);
        const parsed = await evaluate(_code);
        !evaluateOnly && cycle.start();
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

  const stop = () => {
    cycle.stop(true);
    setActiveCode(undefined);
  };

  const evaluateOnly = () => {
    activateCode(code, true);
  };

  useEffect(() => {
    return () => stop();
  }, []);

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
    stop,
    setActiveCode,
    activateCode,
    evaluateOnly,
    activeCode,
    pushLog,
    hash,
  };
}

export default useRepl;
