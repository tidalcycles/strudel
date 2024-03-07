// eslint-disable-next-line no-undef
importScripts('./neozyklus.js');
// TODO: swap below line with above one when firefox supports esm imports in service workers
// see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker?retiredLocale=de#browser_compatibility
// import createClock from './zyklus.mjs';

function getTime() {
  const precision = 10 ** 4;
  const seconds = performance.now() / 1000;
  return Math.round(seconds * precision) / precision;
}

let numPorts = 0;
let num_cycles_at_cps_change = 0;
let num_ticks_since_cps_change = 0;
let cps = 0.5;
const duration = 0.1;
const channel = new BroadcastChannel('strudeltick');

const sendMessage = (type, payload) => {
  channel.postMessage({ type, payload });
};

const sendTick = (phase, duration, tick, time) => {
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

//create clock method from zyklus
const clock = this.createClock(getTime, sendTick, duration);
let started = false;

const startClock = () => {
  if (started) {
    return;
  }
  clock.start();
  started = true;
};
const stopClock = async () => {
  //dont stop the clock if mutliple instances are using it...
  if (!started || numPorts !== 1) {
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

this.onconnect = function (e) {
  // the incoming port
  const port = e.ports[0];
  numPorts = numPorts + 1;
  port.addEventListener('message', function (e) {
    processMessage(e.data);
  });
  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};
