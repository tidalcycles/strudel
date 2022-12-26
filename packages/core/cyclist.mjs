/*
cyclist.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/cyclist.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import createClock from './zyklus.mjs';
import { logger } from './logger.mjs';

export class Cyclist {
  worker;
  pattern;
  started = false;
  cps = 1; // TODO
  getTime;
  phase = 0;
  constructor({ interval, onTrigger, onToggle, onError, getTime, latency = 0.1 }) {
    this.getTime = getTime;
    this.onToggle = onToggle;
    this.latency = latency;
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
          haps.forEach((hap) => {
            if (hap.part.begin.equals(hap.whole.begin)) {
              const deadline = hap.whole.begin + this.origin - time + latency;
              const duration = hap.duration * 1;
              onTrigger?.(hap, deadline, duration);
            }
          });
        } catch (e) {
          logger(`[cyclist] error: ${e.message}`);
          onError?.(e);
        }
      }, // called slightly before each cycle
      interval, // duration of each cycle
    );
  }
  getPhase() {
    return this.getTime() - this.origin - this.latency;
  }
  now() {
    return this.getTime() - this.origin + this.clock.minLatency;
  }
  setStarted(v) {
    this.started = v;
    this.onToggle?.(v);
  }
  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    logger('[cyclist] start');
    this.clock.start();
    this.setStarted(true);
  }
  pause() {
    logger('[cyclist] pause');
    this.clock.pause();
    this.setStarted(false);
  }
  stop() {
    logger('[cyclist] stop');
    this.clock.stop();
    this.setStarted(false);
  }
  setPattern(pat, autostart = false) {
    this.pattern = pat;
    if (autostart && !this.started) {
      this.start();
    }
  }
  setCps(cps = 1) {
    this.cps = cps;
  }
  log(begin, end, haps) {
    const onsets = haps.filter((h) => h.hasOnset());
    console.log(`${begin.toFixed(4)} - ${end.toFixed(4)} ${Array(onsets.length).fill('I').join('')}`);
  }
}
