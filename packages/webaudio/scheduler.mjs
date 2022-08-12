/*
scheduler.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/webaudio/scheduler.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ClockWorker } from './clockworker.mjs';

export class Scheduler {
  worker;
  pattern;
  phase;
  audioContext;
  cps = 1;
  constructor({ audioContext, interval = 0.1, onEvent, latency = 0.1 }) {
    this.audioContext = audioContext;
    this.worker = new ClockWorker((tick, interval) => {
      const begin = this.phase;
      const end = this.phase + interval * this.cps;
      this.phase = end;
      const haps = this.pattern.queryArc(begin, end);
      haps.forEach((e) => {
        if (!e.part.begin.equals(e.whole.begin)) {
          return;
        }
        if (e.context.onTrigger) {
          const ctxTime = (e.whole.begin - begin) / this.cps + this.audioContext.currentTime + latency;
          e.context.onTrigger(ctxTime, e, this.audioContext.currentTime, this.cps);
        }
        if (onEvent) {
          onEvent?.(e);
        }
      });
    }, interval);
  }
  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    this.audioContext.resume();
    this.phase = 0;
    this.worker.start();
  }
  stop() {
    this.worker.stop();
  }
  setPattern(pat) {
    this.pattern = pat;
  }
  setCps(cps = 1) {
    this.cps = cps;
  }
}
