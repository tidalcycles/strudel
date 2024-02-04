/*
cyclist.mjs - recieves clock pulses from clockworker, and schedules the next events
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/cyclist.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { logger } from './logger.mjs';

export class Cyclist {
  constructor({ onTrigger, onToggle, getTime }) {
    this.started = false;
    this.cps = 0.5;
    this.lastTick = 0; // absolute time when last tick (clock callback) happened
    this.getTime = getTime; // get absolute time

    this.num_cycles_at_cps_change = 0;
    this.onToggle = onToggle;
    this.latency = 0.1; // fixed trigger time offset
    this.cycle = 0;

    this.worker = new SharedWorker(new URL('./clockworker.mjs', import.meta.url));
    this.worker.port.start();
    let worker_time_dif = 0; // time difference between audio context clock and worker clock
    let weight = 0; // the amount of weight that is applied to the current average when averaging a new time dif
    const maxWeight = 400;
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
    this.worker.port.addEventListener('message', (message) => {
      if (!this.started) {
        return;
      }
      const { payload, type } = message.data;

      switch (type) {
        case 'tick': {
          tickCallback(payload);
        }
      }
    });
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

function getTime(precision) {
  const seconds = performance.now() / 1000;
  return Math.round(seconds * precision) / precision;
}
const allPorts = [];
let num_cycles_at_cps_change = 0;
let num_ticks_since_cps_change = 0;
let cps = 0.5;
const duration = 0.1;

const sendMessage = (type, payload) => {
  allPorts.forEach((port) => {
    port.postMessage({ type, payload });
  });
};

const sendTick = ({ phase, duration, time }) => {
  sendMessage('tick', {
    phase,
    duration,
    time,
    cps,
    num_cycles_at_cps_change,
    num_ticks_since_cps_change,
  });
  num_ticks_since_cps_change++;
};

const clock = createClock(sendTick, duration);
let started = false;

const startClock = () => {
  if (started) {
    return;
  }
  clock.start();
  started = true;
};
const stopClock = () => {
  //dont stop the clock if mutliple instances are using it...
  if (!started || numClientsConnected() > 1) {
    return;
  }
  clock.stop();
  setCycle(0);
  started = false;
};

const setCycle = (cycle) => {
  num_ticks_since_cps_change = 0;
  num_cycles_at_cps_change = cycle;
};

const numClientsConnected = () => allPorts.length;
const processMessage = (message) => {
  const { type, payload } = message;

  switch (type) {
    case 'cpschange': {
      if (payload.cps !== cps) {
        num_cycles_at_cps_change = num_cycles_at_cps_change + num_ticks_since_cps_change * duration * cps;
        cps = payload.cps;
        num_ticks_since_cps_change = 0;
      }
      break;
    }
    case 'setcycle': {
      setCycle(payload.cycle);
      break;
    }
    case 'toggle': {
      if (payload.started) {
        startClock();
      } else {
        stopClock();
      }
      break;
    }
  }
};

self.onconnect = function (e) {
  // the incoming port
  const port = e.ports[0];
  allPorts.push(port);
  port.addEventListener('message', function (e) {
    processMessage(e.data);
  });
  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};

function createClock(
  callback, // called slightly before each cycle
  duration,
) {
  const interval = 0.1;
  const overlap = interval / 2;
  const precision = 10 ** 4; // used to round phase
  const minLatency = 0.01;
  let phase = 0; // next callback time

  const onTick = () => {
    const t = getTime(precision);
    const lookahead = t + interval + overlap; // the time window for this tick
    if (phase === 0) {
      phase = t + minLatency;
    }
    // callback as long as we're inside the lookahead
    while (phase < lookahead) {
      phase = Math.round(phase * precision) / precision;
      phase >= t && callback({ phase, duration, time: t });
      phase < t && console.log('TOO LATE', phase); // what if latency is added from outside?
      phase += duration; // increment phase by duration
    }
  };
  let intervalID;
  const start = () => {
    clear(); // just in case start was called more than once
    onTick();
    intervalID = setInterval(onTick, interval * 1000);
  };
  const clear = () => intervalID !== undefined && clearInterval(intervalID);
  const stop = () => {
    phase = 0;
    clear();
  };

  return { start, stop };
}
