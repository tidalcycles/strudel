/*
neocyclist.mjs - event scheduler like cyclist, except recieves clock pulses from clockworker in order to sync across multiple instances.
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/neocyclist.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { logger } from './logger.mjs';

export class NeoCyclist {
  constructor({ onTrigger, onToggle, getTime }) {
    this.started = false;
    this.cps = 0.5;
    this.lastTick = 0; // absolute time when last tick (clock callback) happened
    this.getTime = getTime; // get absolute time

    this.num_cycles_at_cps_change = 0;
    this.onToggle = onToggle;
    this.latency = 0.1; // fixed trigger time offset
    this.cycle = 0;

    this.worker = new SharedWorker(new URL('./clockworker.js', import.meta.url));
    this.worker.port.start();

    this.channel = new BroadcastChannel('strudeltick');
    let worker_time_dif = 0; // time difference between audio context clock and worker clock
    let weight = 0; // the amount of weight that is applied to the current average when averaging a new time dif
    const maxWeight = 20;
    const precision = 10 ** 3; //round off time diff to prevent accumulating outliers

    // the clock of the worker and the audio context clock can drift apart over time
    // aditionally, the message time of the worker pinging the callback to process haps can be inconsistent.
    // we need to keep a rolling weighted average of the time difference between the worker clock and audio context clock
    // in order to schedule events consistently.
    const setTimeReference = (time, workertime) => {
      const time_dif = workertime - time;
      if (worker_time_dif === 0) {
        worker_time_dif = time_dif;
      } else {
        const w = 1; //weight of new time diff;
        const new_dif = Math.round(((worker_time_dif * weight + time_dif * w) / (weight + w)) * precision) / precision;

        if (new_dif != worker_time_dif) {
          // reset the weight so the clock recovers faster from an audio context freeze/dropout if it happens
          weight = 4;
        }
        worker_time_dif = new_dif;
      }
    };

    const getTickDeadline = (phase, time) => {
      return phase - time - worker_time_dif;
    };

    const tickCallback = (payload) => {
      const workertime = payload.time;
      const time = this.getTime();

      const { duration, phase, num_ticks_since_cps_change, num_cycles_at_cps_change, cps } = payload;
      setTimeReference(time, workertime);
      this.cps = cps;

      //calculate begin and end
      const eventLength = duration * cps;
      const num_cycles_since_cps_change = num_ticks_since_cps_change * eventLength;
      const begin = num_cycles_at_cps_change + num_cycles_since_cps_change;
      const tickdeadline = getTickDeadline(phase, time);
      const end = begin + eventLength;

      //calculate current cycle
      const lastTick = time + tickdeadline;
      const secondsSinceLastTick = time - lastTick - duration;
      this.cycle = begin + secondsSinceLastTick * cps;

      //set the weight of average time diff and processs haps
      weight = Math.min(weight + 1, maxWeight);
      processHaps(begin, end, tickdeadline);
      this.time_at_last_tick_message = this.getTime();
    };

    const processHaps = (begin, end, tickdeadline) => {
      if (this.started === false) {
        return;
      }
      const haps = this.pattern.queryArc(begin, end, { _cps: this.cps });

      haps.forEach((hap) => {
        if (hap.part.begin.equals(hap.whole.begin)) {
          const deadline = (hap.whole.begin - begin) / this.cps + tickdeadline + this.latency;
          const duration = hap.duration / this.cps;
          onTrigger?.(hap, deadline, duration, this.cps);
        }
      });
    };

    // receive messages from worker clock and process them
    this.channel.onmessage = (message) => {
      if (!this.started) {
        return;
      }
      const { payload, type } = message.data;

      switch (type) {
        case 'tick': {
          tickCallback(payload);
        }
      }
    };
  }
  sendMessage(type, payload) {
    this.worker.port.postMessage({ type, payload });
  }

  now() {
    const gap = (this.getTime() - this.time_at_last_tick_message) * this.cps;
    return this.cycle + gap;
  }
  setCps(cps = 1) {
    this.sendMessage('cpschange', { cps });
  }
  setCycle(cycle) {
    this.sendMessage('setcycle', { cycle });
  }
  setStarted(started) {
    this.sendMessage('toggle', { started });
    this.started = started;
    this.onToggle?.(started);
  }
  start() {
    logger('[cyclist] start');
    this.setStarted(true);
  }
  stop() {
    logger('[cyclist] stop');
    this.setStarted(false);
  }
  setPattern(pat, autostart = false) {
    this.pattern = pat;
    if (autostart && !this.started) {
      this.start();
    }
  }

  log(begin, end, haps) {
    const onsets = haps.filter((h) => h.hasOnset());
    console.log(`${begin.toFixed(4)} - ${end.toFixed(4)} ${Array(onsets.length).fill('I').join('')}`);
  }
}
