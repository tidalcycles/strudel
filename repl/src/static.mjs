/*
static.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/static.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Tone } from '@strudel.cycles/tone';
import { State, TimeSpan } from '@strudel.cycles/core';
import { evaluate } from '@strudel.cycles/eval';
import { webaudioOutputTrigger } from '@strudel.cycles/webaudio';

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
        const { onTrigger = webaudioOutputTrigger } = event.context;
        onTrigger(time, event);
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
