import { useEffect, useState } from 'react';
import { Tone } from '@strudel/tone';
import { State, TimeSpan } from '@strudel/core';

/* export declare interface UseCycleProps {
  onEvent: ToneEventCallback<any>;
  onQuery?: (state: State) => Hap[];
  onSchedule?: (events: Hap[], cycle: number) => void;
  onDraw?: ToneEventCallback<any>;
  ready?: boolean; // if false, query will not be called on change props
} */

// function useCycle(props: UseCycleProps) {
function useCycle(props) {
  // onX must use useCallback!
  const { onEvent, onQuery, onSchedule, ready = true, onDraw } = props;
  const [started, setStarted] = useState(false);
  const cycleDuration = 1;
  const activeCycle = () => Math.floor(Tone.getTransport().seconds / cycleDuration);

  // pull events with onQuery + count up to next cycle
  const query = (cycle = activeCycle()) => {
    const timespan = new TimeSpan(cycle, cycle + 1);
    const events = onQuery?.(new State(timespan)) || [];
    onSchedule?.(events, cycle);
    // cancel events after current query. makes sure no old events are player for rescheduled cycles
    // console.log('schedule', cycle);
    // query next cycle in the middle of the current
    const cancelFrom = timespan.begin.valueOf();
    Tone.getTransport().cancel(cancelFrom);
    // const queryNextTime = (cycle + 1) * cycleDuration - 0.1;
    const queryNextTime = (cycle + 1) * cycleDuration - 0.5;

    // if queryNextTime would be before current time, execute directly (+0.1 for safety that it won't miss)
    const t = Math.max(Tone.getTransport().seconds, queryNextTime) + 0.1;
    Tone.getTransport().schedule(() => {
      query(cycle + 1);
    }, t);

    // schedule events for next cycle
    events
      ?.filter((event) => event.part.begin.equals(event.whole.begin))
      .forEach((event) => {
        Tone.getTransport().schedule((time) => {
          const toneEvent = {
            time: event.whole.begin.valueOf(),
            duration: event.whole.end.sub(event.whole.begin).valueOf(),
            value: event.value,
            context: event.context,
          };
          onEvent(time, toneEvent);
          Tone.Draw.schedule(() => {
            // do drawing or DOM manipulation here
            onDraw?.(time, toneEvent);
          }, time);
        }, event.part.begin.valueOf());
      });
  };

  useEffect(() => {
    ready && query();
  }, [onEvent, onSchedule, onQuery, onDraw, ready]);

  const start = async () => {
    setStarted(true);
    await Tone.start();
    Tone.getTransport().start('+0.1');
  };
  const stop = () => {
    Tone.getTransport().pause();
    setStarted(false);
  };
  const toggle = () => (started ? stop() : start());
  return {
    start,
    stop,
    onEvent,
    started,
    setStarted,
    toggle,
    query,
    activeCycle,
  };
}

export default useCycle;
