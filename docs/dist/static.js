import * as Tone from "../_snowpack/pkg/tone.js";
import {State, TimeSpan} from "../_snowpack/link/strudel.js";
import {getPlayableNoteValue} from "../_snowpack/link/util.js";
import {evaluate} from "./evaluate.js";
async function playStatic(code) {
  Tone.getTransport().cancel();
  Tone.getTransport().stop();
  let start, took;
  const seconds = Number(prompt("How many seconds to run?")) || 60;
  start = performance.now();
  console.log("evaluating..");
  const {pattern: pat} = await evaluate(code);
  took = performance.now() - start;
  console.log("evaluate took", took, "ms");
  console.log("querying..");
  start = performance.now();
  const events = pat?.query(new State(new TimeSpan(0, seconds)))?.filter((event) => event.part.begin.equals(event.whole.begin))?.map((event) => ({
    time: event.whole.begin.valueOf(),
    duration: event.whole.end.sub(event.whole.begin).valueOf(),
    value: event.value,
    context: event.context
  }));
  took = performance.now() - start;
  console.log("query took", took, "ms");
  console.log("scheduling..");
  start = performance.now();
  events.forEach((event) => {
    Tone.getTransport().schedule((time) => {
      try {
        const {onTrigger, velocity} = event.context;
        if (!onTrigger) {
          if (defaultSynth) {
            const note = getPlayableNoteValue(event);
            defaultSynth.triggerAttackRelease(note, event.duration, time, velocity);
          } else {
            throw new Error("no defaultSynth passed to useRepl.");
          }
        } else {
          onTrigger(time, event);
        }
      } catch (err) {
        console.warn(err);
        err.message = "unplayable event: " + err?.message;
        console.error(err);
      }
    }, event.time);
  });
  took = performance.now() - start;
  console.log("scheduling took", took, "ms");
  console.log("now starting!");
  Tone.getTransport().start("+0.5");
}
export default playStatic;
