/*
neocyclist.mjs - event scheduler like cyclist, except recieves clock pulses from clockworker in order to sync across multiple instances.
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/neocyclist.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { logger } from './logger.mjs';
import { ClockCollator, cycleToSeconds } from './util.mjs';

export class NeoCyclist {
  constructor({ onTrigger, onToggle, getTime }) {
    this.started = false;
    this.cps = 0.5;
    this.lastTick = 0; // absolute time when last tick (clock callback) happened
    this.getTime = getTime; // get absolute time
    this.time_at_last_tick_message = 0;
    // the clock of the worker and the audio context clock can drift apart over time
    // aditionally, the message time of the worker pinging the callback to process haps can be inconsistent.
    // we need to keep a rolling average of the time difference between the worker clock and audio context clock
    // in order to schedule events consistently.
    this.collator = new ClockCollator({ getTargetClockTime: getTime });
    this.onToggle = onToggle;
    this.latency = 0.1; // fixed trigger time offset
    this.cycle = 0;
    this.id = Math.round(Date.now() * Math.random());
    this.worker = new SharedWorker(new URL('./clockworker.js', import.meta.url));
    this.worker.port.start();
    this.channel = new BroadcastChannel('strudeltick');
    const tickCallback = (payload) => {
      const { cps, begin, end, cycle, time } = payload;
      this.cps = cps;
      this.cycle = cycle;
      const currentTime = this.collator.calculateOffset(time) + time;
      processHaps(begin, end, currentTime);
      this.time_at_last_tick_message = currentTime;
    };

    const processHaps = (begin, end, currentTime) => {
      if (this.started === false) {
        return;
      }

      const haps = this.pattern.queryArc(begin, end, { _cps: this.cps });
      haps.forEach((hap) => {
        if (hap.hasOnset()) {
          const timeUntilTrigger = cycleToSeconds(hap.whole.begin - this.cycle, this.cps);
          const targetTime = timeUntilTrigger + currentTime + this.latency;
          const duration = cycleToSeconds(hap.duration, this.cps);
          onTrigger?.(hap, 0, duration, this.cps, targetTime);
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
    this.worker.port.postMessage({ type, payload, id: this.id });
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
    this.collator.reset();
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
