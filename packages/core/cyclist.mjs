/*
cyclist.mjs - event scheduler for a single strudel instance. for multi-instance scheduler, see - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/neocyclist.mjs>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/cyclist.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import createClock from './zyklus.mjs';
import { logger } from './logger.mjs';

export class Cyclist {
  constructor({ interval = 0.05, onTrigger, onToggle, onError, getTime, latency = 0.1, setInterval, clearInterval }) {
    this.started = false;
    this.cps = 0.5;
    this.time_at_last_tick_message = 0;
    this.cycle = 0;
    this.getTime = getTime; // get absolute time
    this.num_cycles_at_cps_change = 0;
    this.seconds_at_cps_change; // clock phase when cps was changed
    this.num_ticks_since_cps_change = 0;
    this.onToggle = onToggle;
    this.latency = latency; // fixed trigger time offset

    this.interval = interval;

    this.clock = createClock(
      getTime,
      // called slightly before each cycle
      (phase, duration, _, time) => {
        if (this.started === false) {
          return;
        }
        const num_seconds_since_cps_change = this.num_ticks_since_cps_change * duration;
        const tickdeadline = phase - time;
        const lastTick = time + tickdeadline;
        const num_cycles_since_cps_change = num_seconds_since_cps_change * this.cps;
        const begin = this.num_cycles_at_cps_change + num_cycles_since_cps_change;
        const secondsSinceLastTick = time - lastTick - duration;
        const eventLength = duration * this.cps;
        const end = begin + eventLength;
        this.cycle = begin + secondsSinceLastTick * this.cps;
        const num_seconds_at_cps_change = this.num_cycles_at_cps_change / this.cps;
        const time_dif = time - (num_seconds_at_cps_change + num_seconds_since_cps_change) + tickdeadline;

        //account for latency and tick duration when using cycle calculations for audio downstream
        const cycle_gap = (this.latency - duration) * this.cps;
        const haps = this.pattern.queryArc(begin, end, { _cps: this.cps });

        haps.forEach((hap) => {
          if (hap.hasOnset()) {
            let targetTime = (hap.whole.begin - this.num_cycles_at_cps_change) / this.cps;
            targetTime = targetTime + num_seconds_at_cps_change + this.latency + time_dif;
            const duration = hap.duration / this.cps;
            onTrigger?.(hap, tickdeadline, duration, this.cps, targetTime, this.cycle - cycle_gap);
          }
        });
        this.time_at_last_tick_message = time;
        this.num_ticks_since_cps_change++;
      },
      interval, // duration of each cycle
      0.1,
      0.1,
      setInterval,
      clearInterval,
    );
  }
  now() {
    if (!this.started) {
      return 0;
    }
    const gap = (this.getTime() - this.time_at_last_tick_message) * this.cps;
    return this.cycle + gap;
  }

  setCycle = (cycle) => {
    this.num_ticks_since_cps_change = 0;
    this.num_cycles_at_cps_change = cycle;
  };
  setStarted(v) {
    this.started = v;

    this.setCycle(0);
    this.onToggle?.(v);
  }
  start() {
    this.num_ticks_since_cps_change = 0;
    this.num_cycles_at_cps_change = 0;

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
    this.lastEnd = 0;
    this.setStarted(false);
  }
  setPattern(pat, autostart = false) {
    this.pattern = pat;
    if (autostart && !this.started) {
      this.start();
    }
  }
  setCps(cps = 0.5) {
    if (this.cps === cps) {
      return;
    }
    const num_seconds_since_cps_change = this.num_ticks_since_cps_change * this.interval;
    this.num_cycles_at_cps_change = this.num_cycles_at_cps_change + num_seconds_since_cps_change * cps;
    this.cps = cps;
    this.num_ticks_since_cps_change = 0;
  }
  log(begin, end, haps) {
    const onsets = haps.filter((h) => h.hasOnset());
    console.log(`${begin.toFixed(4)} - ${end.toFixed(4)} ${Array(onsets.length).fill('I').join('')}`);
  }
}
