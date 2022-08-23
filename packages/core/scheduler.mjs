/*
scheduler.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/scheduler.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ClockWorker } from './clockworker.mjs';

// TODO: make pause work with origin.
// find out why setPattern takes so long
// reimplement setCps

export class Scheduler {
  worker;
  pattern;
  started = false;
  origin;
  phase = 0;
  cps = 1;
  getTime;
  constructor({ interval, onTrigger, onError, latency = 0.1, getTime }) {
    this.worker = new ClockWorker((_, interval) => {
      try {
        // first, calculate queryArc, where
        // - first query should start from zero
        // - next query must start where the other left off
        // - queries must be synced to the interval clock => no drifting
        const begin = this.phase; // begin where we left off last time || 0
        const time = getTime();
        this.origin = this.origin ?? time; // capture timestamp of first tick
        const runTime = time - this.origin; // how long the scheduler is running since start
        const cps = this.cps; // remember cps used to calculate the current slice
        // TODO: find a way to implement cps without jumps..
        const end = (runTime + interval) * cps;
        // console.log('runTime', runTime);
        this.phase = end; // remember where we left off fro next query
        const haps = this.pattern.queryArc(begin, end); // get haps
        const t = getTime(); // need new timestamp after query (can take a few ms)
        // schedule each hap
        haps.forEach((hap) => {
          if (typeof hap.value?.cps === 'number') {
            this.setCps(hap.value?.cps);
          }
          // skip haps without onset
          if (!hap.part.begin.equals(hap.whole.begin)) {
            return;
          }
          // calculate absolute time for this hap, .whole.begin is relative to 0, so we need to add the origin
          const scheduledTime = hap.whole.begin / cps + latency + this.origin;
          // deadline = time in s until the event should be scheduled
          const deadline = scheduledTime - t;
          if (deadline < 0) {
            console.warn(`deadline ${deadline.toFixed(2)} is below zero! latency ${latency}s, interval ${interval}s`);
            return;
          }
          // TODO: use legato / duration of objectified value
          const duration = hap.duration / this.cps;
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
    delete this.origin;
    this.started = false;
  }
  stop() {
    console.log('stop');
    this.phase = 0;
    delete this.origin;
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
