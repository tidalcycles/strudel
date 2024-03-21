import workerUrl from './worker.mjs?url';
import { samples, superdough } from 'superdough';

let ctx;
document.addEventListener('click', async () => {
  ctx = new AudioContext();
  await samples('github:tidalcycles/dirt-samples');
  initWorker();
});

function initWorker() {
  if (!globalThis.Worker) {
    throw new Error('initWorker: Worker not supported in this environment');
  }
  const worker = new Worker(workerUrl);
  worker.postMessage({ origin: performance.timeOrigin });
  // worker.postMessage(1);
  let origin;
  let minLatency = 0.05;

  let init = performance.now();

  // performance.timeOrigin; // unix timestamp when the page loads
  // Date.now() // unix timestamp (ms since January 1st 1970)
  // performance.timeOrigin // unix timestamp when the page loaded
  // performance.now() // precise ms since the page loaded
  // performance.timeOrigin + performance.now() ~= Date.now()

  // worker: performance.now() // precise ms since the worker loaded
  // worker: performance.timeOrigin // unix timestamp when the worker loaded

  worker.onmessage = (e) => {
    const { contextTime, performanceTime } = ctx.getOutputTimestamp();
    console.log('e', e.timeStamp, performance.now());
    /*  // clock offsets
    const { contextTime: t } = outputTimestamp; // audio clock time in seconds
    const { performanceTime: now } = outputTimestamp; // estimated system clock time for contextTime
    const { origin: workerOrigin } = e.data; // seconds when the worker was loaded
    const { phase } = e.data; // target time in seconds of current tick (relative to system clock)

    let workerOriginDiffMs = workerOrigin - performance.timeOrigin;
    // console.log('worker created after seconds:', workerOriginDiffMs);

    let workerOriginDiffSeconds = workerOriginDiffMs / 1000;

    let workerPhaseSeconds = phase + workerOriginDiffSeconds;
    let nowSeconds = now / 1000;

    let workerDeadline = workerPhaseSeconds - nowSeconds; */

    // console.log('workerDeadline', workerDeadline);

    // superdough({ s: 'bd' }, workerDeadline);

    e.data.forEach((event, i) => {
      let phase = event.phase * 1000;
      //let phase = event.tick * 100 + origin;
      let diff = (phase - performanceTime) / 1000;
      superdough({ s: 'bd' }, contextTime + diff + 2);
    });

    /* const deadline = phase - now;

    const { tickOrigin } = e.data; // ms when the first tick happened

    const { tick, begin, end, haps, cps } = e.data;

    // console.log('phase', phase);
    if (tick === 0) {
      console.log('set origin', t);
      origin = t;
    }
    // console.log('tick', tick, begin, end, phase, origin);
    haps.forEach((hap) => {
      let hapBegin = hap.whole.begin;
      hapBegin = (hapBegin.s * hapBegin.n) / hapBegin.d;
      const stamp = ctx.getOutputTimestamp();

      let targetTime = origin + hapBegin * cps;
      let deadline = t - targetTime + minLatency;
      // console.log('--hap, begin:', begin, 'deadline', deadline);
      // console.log('hap', hap.value, begin, deadline);
      superdough(hap.value, deadline);
    }); */

    // const stamp = ctx?.getOutputTimestamp();
    // console.log('stamp', stamp);
  };
}
