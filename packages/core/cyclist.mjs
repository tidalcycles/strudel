/*
cyclist.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/cyclist.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import createClock from './zyklus.mjs';
import { logger } from './logger.mjs';
import { Invoke } from '../../website/src/tauri.mjs';
import { listen } from '@tauri-apps/api/event';

export class Cyclist {
  constructor({ interval, onTrigger, onToggle, onError, getTime, latency = 0.1 }) {
    this.started = false;
    this.cps = 1;
    this.lastTick = 0; // absolute time when last tick (clock callback) happened
    this.lastBegin = 0; // query begin of last tick
    this.lastEnd = 0; // query end of last tick
    this.getTime = getTime; // get absolute time
    this.onToggle = onToggle;
    this.start_timer;
    this.abeLinkListener = listen('abelink-event', async (e) => {
      const payload = e?.payload;
      if (payload == null) {
        return;
      }
      const { play, bpm, timestamp } = payload;
      // (if bpm !== prev_bpm) {
      //update the clock
      // }
      if (this.started !== play && play != null) {
        if (play) {
          this.start_timer = window.setTimeout(() => {
            logger('[cyclist] start');
            this.clock.start();
            this.setStarted(true);
          }, timestamp - Date.now());
        } else {
          this.stop();
        }
      }

      const { message, message_type } = e.payload;
    });
    this.latency = latency; // fixed trigger time offset
    const round = (x) => Math.round(x * 1000) / 1000;
    this.clock = createClock(
      getTime,
      // called slightly before each cycle
      (phase, duration, tick) => {
        if (tick === 0) {
          this.origin = phase;
        }
        try {
          const time = getTime();
          const begin = this.lastEnd;
          this.lastBegin = begin;
          const end = round(begin + duration * this.cps);
          this.lastEnd = end;
          const haps = this.pattern.queryArc(begin, end);
          const tickdeadline = phase - time; // time left till phase begins
          this.lastTick = time + tickdeadline;

          haps.forEach((hap) => {
            if (hap.part.begin.equals(hap.whole.begin)) {
              const deadline = (hap.whole.begin - begin) / this.cps + tickdeadline + latency;
              const duration = hap.duration / this.cps;
              onTrigger?.(hap, deadline, duration, this.cps);
            }
          });
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
  startClock() {}
  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }

    const linkmsg = {
      bpm: 110,
      play: true,
      timestamp: Date.now(),
    };
    Invoke('sendabelinkmsg', { linkmsg });
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
    const linkmsg = {
      bpm: 110,
      play: false,
      timestamp: Date.now(),
    };
    Invoke('sendabelinkmsg', { linkmsg });
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
