/*
scheduler.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/scheduler.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ClockWorker } from './clockworker.mjs';

export class Scheduler {
  worker;
  pattern;
  started = false;
  phase = 0;
  cps = 1;
  getTime;
  lastTime;
  constructor({ interval, onTrigger, onError, latency = 0.2, getTime }) {
    this.worker = new ClockWorker((_, interval) => {
      try {
        // goals:
        // - first query should start from zero
        // - next query must start where the other left off
        // - queries must be synced to the interval clock => no drifting
        const time = getTime();
        if (!this.lastTime) {
          this.lastTime = time;
          return;
        }
        const passed = time - this.lastTime; // how much time passed since the last callback?
        this.lastTime = time;
        const begin = this.phase; // begin where we left off last time || 0
        const end = this.phase + passed * this.cps;
        this.phase = end; // remember where we left off fro next query

        const haps = this.pattern.queryArc(begin, end); // get haps
        // schedule each hap
        haps.forEach((hap) => {
          if (typeof hap.value?.cps === 'number') {
            this.setCps(hap.value?.cps);
          }
          // skip haps without onset
          if (!hap.part.begin.equals(hap.whole.begin)) {
            return;
          }
          const scheduled = time + (hap.whole.begin - begin) / this.cps + latency - passed; // this took me ages...
          const duration = hap.duration / this.cps; // TODO: use legato / duration of objectified value
          const now = getTime();
          const deadline = scheduled - now;
          if (scheduled < now) {
            console.warn(`deadline ${deadline.toFixed(2)} is below zero! latency ${latency}s, interval ${interval}s`);
            return;
          }
          onTrigger?.(hap, deadline, duration);
        });
      } catch (err) {
        console.warn('scheduler error', err);
        onError?.(err);
      }
    }, interval);
  }
  start() {
    console.log('start');
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    this.worker.start();
    this.started = true;
  }
  pause() {
    console.log('pause');
    this.worker.stop();
    this.phase = 0;
    delete this.lastTime;
    this.started = false;
  }
  stop() {
    console.log('stop');
    this.phase = 0;
    delete this.lastTime;
    this.worker.stop();
    this.started = false;
  }
  setPattern(pat) {
    console.log('set pattern!');
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
