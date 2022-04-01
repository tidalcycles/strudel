// helpers to create a worker dynamically without needing a server / extra file
const stringifyFunction = (func) => '(' + func + ')();';
const urlifyFunction = (func) => URL.createObjectURL(new Blob([stringifyFunction(func)], { type: 'text/javascript' }));
const createWorker = (func) => new Worker(urlifyFunction(func));

// this class is basically the tale of two clocks
class ClockWorker {
  worker;
  audioContext;
  interval = 0.2; // query span
  lastEnd = 0;
  constructor(audioContext, callback, interval = this.interval) {
    this.audioContext = audioContext;
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
    const precision = 100;
    this.worker.onmessage = (e) => {
      if (e.data === 'tick') {
        const begin = this.lastEnd || this.audioContext.currentTime;
        const end = this.audioContext.currentTime + this.interval; // DONT reference begin here!
        this.lastEnd = end;
        // callback with query span, using clock #2 (the audio clock)
        callback(begin, end);
      }
    };
  }
  start() {
    console.log('start...');
    this.audioContext.resume();
    this.worker.postMessage('start');
  }
  stop() {
    console.log('stop...');
    this.worker.postMessage('stop');
  }
}

export default ClockWorker;
