/*
cyclist.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/scheduler.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// import { ClockWorker } from './clockworker.mjs';
import createClock from './zyklus.mjs';

export class Cyclist {
  worker;
  pattern;
  started = false;
  cps = 1; // TODO
  getTime;
  phase = 0;
  constructor({ interval, onTrigger, onError, getTime, latency = 0.1 }) {
    this.getTime = getTime;
    const round = (x) => Math.round(x * 1000) / 1000;
    this.clock = createClock(
      getTime,
      (phase, duration, tick) => {
        if (tick === 0) {
          this.origin = phase;
        }
        const begin = round(phase - this.origin);
        this.phase = begin - latency;
        const end = round(begin + duration);
        const time = getTime();
        try {
          const haps = this.pattern.queryArc(begin, end); // get Haps
          // console.log('haps', haps.map((hap) => hap.value.n).join(' '));
          haps.forEach((hap) => {
            // console.log('hap', hap.value.n, hap.part.begin);
            if (hap.part.begin.equals(hap.whole.begin)) {
              const deadline = hap.whole.begin + this.origin - time + latency;
              const duration = hap.duration * 1;
              onTrigger?.(hap, deadline, duration);
            }
          });
        } catch (e) {
          console.warn('scheduler error', e);
          onError?.(e);
        }
      }, // called slightly before each cycle
      interval, // duration of each cycle
    );
  }
  getPhase() {
    return this.phase;
  }
  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    this.clock.start();
    this.started = true;
  }
  pause() {
    this.clock.stop();
    delete this.origin;
    this.started = false;
  }
  stop() {
    delete this.origin;
    this.clock.stop();
    this.started = false;
  }
  setPattern(pat) {
    this.pattern = pat;
  }
  setCps(cps = 1) {
    this.cps = cps;
  }
  log(begin, end, haps) {
    const onsets = haps.filter((h) => h.hasOnset());
    console.log(`${begin.toFixed(4)} - ${end.toFixed(4)} ${Array(onsets.length).fill('I').join('')}`);
  }
}
