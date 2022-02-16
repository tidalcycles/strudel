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
    const events = onQuery?.(timespan) || [];
    onSchedule?.(events, cycle);
    // cancel events after current query. makes sure no old events are player for rescheduled cycles
    // console.log('schedule', cycle);
    // query next cycle in the middle of the current
    const cancelFrom = timespan.begin.valueOf();
    Tone.Transport.cancel(cancelFrom);
    const queryNextTime = (cycle + 1) * cycleDuration - 0.1;
    const delta = queryNextTime - Tone.Transport.seconds;
    if (delta < 0.2) {
      // if calling Tone.Transport.schedule barely before the scheduled time, it sometimes happen that the event is swallowed
      // i think this has something to do with the fact that Tone.Transport.schedule is called with a time that is slightly before the scheduled time
      // so, if the delta is too small (using 0.2 for no specific reason), just schedule directly
      // this if branch should only be entered if the user triggers the scheduling, to make sure no endless recursion is happening
      query(cycle + 1);
    } else {
      Tone.Transport.schedule(() => {
        query(cycle + 1);
      }, queryNextTime);
    }
    // schedule events for next cycle
    events
      ?.filter((event) => event.part.begin.valueOf() === event.whole.begin.valueOf())
      .forEach((event) => {
        Tone.Transport.schedule((time) => {
          const toneEvent = {
            time: event.part.begin.valueOf(),
            duration: event.whole.end.sub(event.whole.begin).valueOf(),
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
  return { start, stop, onEvent, started, toggle, query, activeCycle };
}

export default useCycle;
