/*
clockworker.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/clockworker.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// helpers to create a worker dynamically without needing a server / extra file
const stringifyFunction = (func) => '(' + func + ')();';
const urlifyFunction = (func) => URL.createObjectURL(new Blob([stringifyFunction(func)], { type: 'text/javascript' }));
const createWorker = (func) => new Worker(urlifyFunction(func));

// this is just a setInterval with a counter, running in a worker
export class ClockWorker {
  worker;
  interval = 1 / 10; // query span, use powers of 2 to get better float accuracy
  tick = 0;
  constructor(callback, interval = this.interval) {
    this.interval = interval;
    this.worker = createWorker(() => {
      // we cannot use closures here!
      let interval;
      let timerID = null; // this is clock #1 (the sloppy js clock)
      const clear = () => {
        if (timerID) {
          clearInterval(timerID);
          timerID = null;
        }
      };
      const start = () => {
        clear();
        if (!interval) {
          throw new Error('no interval set! call worker.postMessage({interval}) before starting.');
        }
        postMessage('tick');
        timerID = setInterval(() => postMessage('tick'), interval * 1000);
      };
      self.onmessage = function (e) {
        if (e.data == 'start') {
          start();
        } else if (e.data.interval) {
          interval = e.data.interval;
          if (timerID) {
            start();
          }
        } else if (e.data == 'stop') {
          clear();
        }
      };
    });
    this.worker.postMessage({ interval });
    // const round = (n, d) => Math.round(n * d) / d;
    this.worker.onmessage = (e) => {
      if (e.data === 'tick') {
        // callback with query span, using clock #2 (the audio clock)
        callback(this.tick++, this.interval);
      }
    };
  }
  start() {
    // console.log('start...');
    this.worker.postMessage('start');
  }
  stop() {
    // console.log('stop...');
    this.worker.postMessage('stop');
    this.tick = 0;
  }
  setInterval(interval) {
    this.worker.postMessage({ interval });
  }
}
