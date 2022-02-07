import {useEffect, useState} from "../_snowpack/pkg/react.js";
import * as Tone from "../_snowpack/pkg/tone.js";
import {TimeSpan} from "../_snowpack/link/strudel.js";
function useCycle(props) {
  const {onEvent, onQuery, onSchedule, ready = true} = props;
  const [started, setStarted] = useState(false);
  const cycleDuration = 1;
  const activeCycle = () => Math.floor(Tone.Transport.seconds / cycleDuration);
  const query = (cycle = activeCycle()) => {
    const timespan = new TimeSpan(cycle, cycle + 1);
    const _events = onQuery?.(timespan) || [];
    onSchedule?.(_events, cycle);
    schedule(_events, cycle);
  };
  const schedule = (events, cycle = activeCycle()) => {
    const timespan = new TimeSpan(cycle, cycle + 1);
    const cancelFrom = timespan.begin.valueOf();
    Tone.Transport.cancel(cancelFrom);
    const queryNextTime = (cycle + 1) * cycleDuration - 0.1;
    const delta = queryNextTime - Tone.Transport.seconds;
    if (delta < 0.2) {
      query(cycle + 1);
    } else {
      Tone.Transport.schedule(() => {
        query(cycle + 1);
      }, queryNextTime);
    }
    events?.filter((event) => event.part.begin.valueOf() === event.whole.begin.valueOf()).forEach((event) => {
      Tone.Transport.schedule((time) => {
        const toneEvent = {
          time: event.part.begin.valueOf(),
          duration: event.whole.end.valueOf() - event.whole.begin.valueOf(),
          value: event.value
        };
        onEvent(time, toneEvent);
      }, event.part.begin.valueOf());
    });
  };
  useEffect(() => {
    ready && query();
  }, [onEvent, onSchedule, onQuery]);
  const start = async () => {
    console.log("start");
    setStarted(true);
    await Tone.start();
    Tone.Transport.start("+0.1");
  };
  const stop = () => {
    console.log("stop");
    setStarted(false);
    Tone.Transport.pause();
  };
  const toggle = () => started ? stop() : start();
  return {start, stop, onEvent, started, toggle, schedule, query, activeCycle};
}
export default useCycle;
