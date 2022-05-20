/*
scheduler.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/webaudio/scheduler.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ClockWorker } from './clockworker.mjs';
import { State, TimeSpan } from '@strudel.cycles/core';

export class Scheduler {
  worker;
  pattern;
  constructor({ audioContext, interval = 0.2, onEvent }) {
    this.worker = new ClockWorker(
      audioContext,
      (begin, end) => {
        this.pattern.query(new State(new TimeSpan(begin, end))).forEach((e) => {
          if (!e.part.begin.equals(e.whole.begin)) {
            return;
          }
          if (onEvent) {
            onEvent?.(e);
          } else {
            console.warn('unplayable event: no audio node nor onEvent callback', e);
          }
        });
      },
      interval,
    );
  }
  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    this.worker.start();
  }
  stop() {
    this.worker.stop();
  }
  setPattern(pat) {
    this.pattern = pat;
  }
}
