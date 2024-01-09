/*
cyclist.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/cyclist.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import createClock from './zyklus.mjs';
import { logger } from './logger.mjs';

export class Cyclist {
  constructor({ interval, onTrigger, onToggle, onError, getTime, latency = 0.1 }) {
    this.started = false;
    this.cps = 1;
    this.num_ticks_since_cps_change = 0;
    this.lastTick = 0; // absolute time when last tick (clock callback) happened
    this.lastBegin = 0; // query begin of last tick
    this.lastEnd = 0; // query end of last tick
    this.getTime = getTime; // get absolute time
    this.num_cycles_at_cps_change = 0;
    this.onToggle = onToggle;
    this.latency = latency; // fixed trigger time offset
    this.broadcast = new BroadcastChannel('strudel_clock');
    this.nextCycleStartTime = 0;
    this.broadcast.onmessage = (event) => {
      const data = event.data;
      const { cps, sendTime, phase, nextCycleStartTime, cycle } = data;
      this.cps = cps;
      const now = Date.now();
      const messageLatency = now - sendTime;
      console.log({ messageLatency });
      this.nextCycleStartTime = now + nextCycleStartTime - messageLatency;
    };
    this.clock = createClock(
      getTime,
      // called slightly before each cycle
      (phase, duration, tick) => {
        if (tick === 0) {
          this.origin = phase;
        }
        if (this.num_ticks_since_cps_change === 0) {
          this.num_cycles_at_cps_change = this.lastEnd;
        }
        this.num_ticks_since_cps_change++;
        try {
          const time = getTime();
          const begin = this.lastEnd;
          this.lastBegin = begin;
          console.log();
          //convert ticks to cycles, so you can query the pattern for events
          const eventLength = duration * this.cps;
          const num_cycles_since_cps_change = this.num_ticks_since_cps_change * eventLength;
          const end = this.num_cycles_at_cps_change + num_cycles_since_cps_change;
          this.lastEnd = end;

          // query the pattern for events
          const haps = this.pattern.queryArc(begin, end);

          const tickdeadline = phase - time; // time left until the phase is a whole number

          this.lastTick = time + tickdeadline;

          haps.forEach((hap) => {
            if (hap.part.begin.equals(hap.whole.begin)) {
              const deadline = (hap.whole.begin - begin) / this.cps + tickdeadline + latency;
              const duration = hap.duration / this.cps;
              onTrigger?.(hap, deadline, duration, this.cps);
            }
          });
          console.log(1 - (num_cycles_since_cps_change % 1));
          if (tick % 1 === 0) {
            // this.broadcast.postMessage({
            //   cps: this.cps,
            //   sendTime: Date.now(),
            //   phase,
            //   nextCycleStartTime: (1 - (num_cycles_since_cps_change % 1)) * this.cps * 1000,
            //   cycle: num_cycles_since_cps_change,
            // });
          }
        } catch (e) {
          logger(`[cyclist] error: ${e.message}`);
          onError?.(e);
        }
      },
      interval, // duration of each cycle
    );
  }
  now() {
    const secondsSinceLastTick = this.getTime() - this.lastTick - this.clock.duration;
    return this.lastBegin + secondsSinceLastTick * this.cps; // + this.clock.minLatency;
  }
  setStarted(v) {
    this.started = v;
    this.onToggle?.(v);
  }
  start() {
    const date = Date.now();
    let wait = this.nextCycleStartTime - date;
    wait = Math.max(0, wait);
    console.log({ wait });

    this.broadcast.postMessage({
      type: 'request_start',
    });

    this.broadcast.onmessage;

    setTimeout(() => {
      this.num_ticks_since_cps_change = 0;
      this.num_cycles_at_cps_change = 0;
      if (!this.pattern) {
        throw new Error('Scheduler: no pattern set! call .setPattern first.');
      }
      logger('[cyclist] start');
      this.clock.start();
      this.setStarted(true);
    }, wait);
  }
  pause() {
    logger('[cyclist] pause');
    this.clock.pause();
    this.setStarted(false);
  }
  stop() {
    logger('[cyclist] stop');
    this.clock.stop();
    this.lastEnd = 0;
    this.setStarted(false);
  }
  setPattern(pat, autostart = false) {
    this.pattern = pat;
    if (autostart && !this.started) {
      this.start();
    }
  }
  setCps(cps = 1) {
    if (this.cps === cps) {
      return;
    }
    this.cps = cps;
    this.num_ticks_since_cps_change = 0;
  }
  log(begin, end, haps) {
    const onsets = haps.filter((h) => h.hasOnset());
    console.log(`${begin.toFixed(4)} - ${end.toFixed(4)} ${Array(onsets.length).fill('I').join('')}`);
  }
}
