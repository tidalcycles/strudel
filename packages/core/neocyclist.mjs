import { logger } from './logger.mjs';

// const sharedworker = new SharedWorker(new URL('./cyclistworker.js', import.meta.url));
// sharedworker.port.start();

export class NeoCyclist {
  constructor({ onTrigger, onToggle, latency = 0.1, onError }) {
    this.started = false;
    this.pattern;
    this.onToggle = onToggle;
    this.latency = latency;
    this.worker = new SharedWorker(new URL('./cyclistworker.js', import.meta.url));
    this.worker.port.start();
    this.cycle = 0;
    this.cps = 1;
    this.timeAtLastTick = 0;
    this.worker.port.addEventListener('message', (message) => {
      if (!this.started) {
        return;
      }
      const { payload, type } = message.data;

      switch (type) {
        case 'tick': {
          this.timeAtLastTickMessage = performance.now();
          let { begin, end, cps, tickdeadline, cycle } = payload;
          this.cps = cps;
          this.cycle = cycle + latency * cps;
          //   const messageLatency = (Date.now() - time) / 1000;
          //   latency = latency - messageLatency

          const haps = this.pattern.queryArc(begin, end);
          haps.forEach((hap) => {
            if (hap.part.begin.equals(hap.whole.begin)) {
              const deadline = (hap.whole.begin - begin) / cps + tickdeadline + latency;
              const duration = hap.duration / cps;
              onTrigger?.(hap, deadline, duration, cps);
            }
          });
          break;
        }
        case 'log': {
          const { type, text } = payload;
          if (type == 'error') {
            onError(text);
          } else {
            logger(text, type);
          }
        }
      }
    });
  }
  sendMessage(type, payload) {
    this.worker.port.postMessage({ type, payload });
  }

  now() {
    // console.log(this.cycle, 'cycle');
    const gap = ((performance.now() - this.timeAtLastTickMessage) / 1000) * this.cps;
    return this.cycle + gap;
    // this.sendMessage('requestcycles', {});
  }
  setCps(cps = 1) {
    this.sendMessage('cpschange', { cps });
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
