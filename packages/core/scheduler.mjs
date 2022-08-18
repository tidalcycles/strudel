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
  constructor({ interval = 0.1, onTrigger, onError, latency = 0.1 }) {
    this.worker = new ClockWorker((_, interval) => {
      try {
        const begin = this.phase;
        const end = this.phase + interval * this.cps;
        this.phase = end;
        const haps = this.pattern.queryArc(begin, end);
        haps.forEach((hap) => {
          if (typeof hap.value?.cps === 'number') {
            this.setCps(hap.value?.cps);
          }
          if (!hap.part.begin.equals(hap.whole.begin)) {
            return;
          }
          const deadline = (hap.whole.begin - begin) / this.cps + latency;
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
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    this.worker.start();
    this.started = true;
  }
  pause() {
    this.worker.stop();
    this.started = false;
  }
  stop() {
    this.phase = 0;
    this.worker.stop();
    this.started = false;
  }
  setPattern(pat) {
    this.pattern = pat;
  }
  setCps(cps = 1) {
    this.cps = cps;
  }
}
