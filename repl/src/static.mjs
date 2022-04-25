import { Tone } from '@strudel.cycles/tone';
import { State, TimeSpan } from '@strudel.cycles/core';
import { getPlayableNoteValue } from '@strudel.cycles/core/util.mjs';
import { evaluate } from '@strudel.cycles/eval';
import { getDefaultSynth } from '@strudel.cycles/tone';

const defaultSynth = getDefaultSynth();

// this is a test to play back events with as less runtime code as possible..
// the code asks for the number of seconds to prequery
// after the querying is done, the events are scheduled
// after the scheduling is done, the transport is started
// nothing happens while tone.js runs except the schedule callback, which is a thin wrapper around triggerAttackRelease calls
// so all glitches that appear here should have nothing to do with strudel and or the repl

async function playStatic(code) {
  Tone.getTransport().cancel();
  Tone.getTransport().stop();
  let start, took;
  const seconds = Number(prompt('How many seconds to run?')) || 60;
  start = performance.now();
  console.log('evaluating..');
  const { pattern: pat } = await evaluate(code);
  took = performance.now() - start;
  console.log('evaluate took', took, 'ms');
  console.log('querying..');
  start = performance.now();
  const events = pat
    ?.query(new State(new TimeSpan(0, seconds)))
    ?.filter((event) => event.part.begin.equals(event.whole.begin))
    ?.map((event) => ({
      time: event.whole.begin.valueOf(),
      duration: event.whole.end.sub(event.whole.begin).valueOf(),
      value: event.value,
      context: event.context,
    }));
  took = performance.now() - start;
  console.log('query took', took, 'ms');
  console.log('scheduling..');
  start = performance.now();
  events.forEach((event) => {
    Tone.getTransport().schedule((time) => {
      try {
        const { onTrigger, velocity } = event.context;
        if (!onTrigger) {
          if (defaultSynth) {
            const note = getPlayableNoteValue(event);
            defaultSynth.triggerAttackRelease(note, event.duration.valueOf(), time, velocity);
          } else {
            throw new Error('no defaultSynth passed to useRepl.');
          }
        } else {
          onTrigger(time, event);
        }
      } catch (err) {
        console.warn(err);
        err.message = 'unplayable event: ' + err?.message;
        console.error(err);
      }
    }, event.time);
  });
  took = performance.now() - start;
  console.log('scheduling took', took, 'ms');
  console.log('now starting!');

  Tone.getTransport().start('+0.5');
}

export default playStatic;
