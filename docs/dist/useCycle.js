import {useEffect, useState} from "../_snowpack/pkg/react.js";
import * as Tone from "../_snowpack/pkg/tone.js";
import {TimeSpan, State} from "../_snowpack/link/strudel.js";
function useCycle(props) {
  const {onEvent, onQuery, onSchedule, ready = true, onDraw} = props;
  const [started, setStarted] = useState(false);
  const cycleDuration = 1;
  const activeCycle = () => Math.floor(Tone.getTransport().seconds / cycleDuration);
  const query = (cycle = activeCycle()) => {
    const timespan = new TimeSpan(cycle, cycle + 1);
    const events = onQuery?.(new State(timespan)) || [];
    onSchedule?.(events, cycle);
    const cancelFrom = timespan.begin.valueOf();
    Tone.getTransport().cancel(cancelFrom);
    const queryNextTime = (cycle + 1) * cycleDuration - 0.5;
    const t = Math.max(Tone.getTransport().seconds, queryNextTime) + 0.1;
    Tone.getTransport().schedule(() => {
      query(cycle + 1);
    }, t);
    events?.filter((event) => event.part.begin.valueOf() === event.whole.begin.valueOf()).forEach((event) => {
      Tone.getTransport().schedule((time) => {
        const toneEvent = {
          time: event.whole.begin.valueOf(),
          duration: event.whole.end.sub(event.whole.begin).valueOf(),
          value: event.value,
          context: event.context
        };
        onEvent(time, toneEvent);
        Tone.Draw.schedule(() => {
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
    Tone.getTransport().start("+0.1");
  };
  const stop = () => {
    console.log("stop");
    setStarted(false);
    Tone.getTransport().pause();
  };
  const toggle = () => started ? stop() : start();
  return {start, stop, setStarted, onEvent, started, toggle, query, activeCycle};
}
export default useCycle;
