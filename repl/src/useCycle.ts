import { useEffect, useRef, useState } from 'react';
import type { ToneEventCallback } from 'tone';
import * as Tone from 'tone';
import { TimeSpan } from '../../strudel.mjs';
import type { Hap } from './types';

export declare interface UseCycleProps {
  onEvent: ToneEventCallback<any>;
  onQuery?: (query: TimeSpan) => Hap[];
  onSchedule?: (events: Hap[], cycle: number) => void;
  ready?: boolean; // if false, query will not be called on change props
}

function useCycle(props: UseCycleProps) {
  // onX must use useCallback!
  const { onEvent, onQuery, onSchedule, ready = true } = props;
  const [started, setStarted] = useState<boolean>(false);
  const cycleDuration = 1;
  const activeCycle = () => Math.floor(Tone.Transport.seconds / cycleDuration);

  // pull events with onQuery + count up to next cycle
  const query = (cycle = activeCycle()) => {
    const timespan = new TimeSpan(cycle, cycle + 1);
    const _events = onQuery?.(timespan) || [];
    onSchedule?.(_events, cycle);
    schedule(_events, cycle);
  };

  const schedule = (events: any[], cycle = activeCycle()) => {
    // cancel events after current query. makes sure no old events are player for rescheduled cycles
    // console.log('schedule', cycle);
    const timespan = new TimeSpan(cycle, cycle + 1);
    // query next cycle in the middle of the current
    const cancelFrom = timespan.begin.valueOf();
    Tone.Transport.cancel(cancelFrom);
    const queryNextTime = (cycle + 1) * cycleDuration - 0.1;
    Tone.Transport.schedule(() => {
      // TODO: find out why this event is sometimes swallowed
      query(cycle + 1);
    }, queryNextTime);
    // schedule events for next cycle
    events?.forEach((event) => {
      Tone.Transport.schedule((time) => {
        const toneEvent = {
          time: event.part.begin.valueOf(),
          duration: event.part.end.valueOf() - event.part.begin.valueOf(),
          value: event.value,
        };
        onEvent(time, toneEvent);
      }, event.part.begin.valueOf());
    });
  };

  useEffect(() => {
    ready && query();
  }, [onEvent, onSchedule, onQuery]);

  const start = async () => {
    console.log('start');
    setStarted(true);
    await Tone.start();
    Tone.Transport.start('+0.1');
  };
  const stop = () => {
    console.log('stop');
    setStarted(false);
    Tone.Transport.pause();
  };
  const toggle = () => (started ? stop() : start());
  return { start, stop, onEvent, started, toggle, schedule, query, activeCycle };
}

export default useCycle;
