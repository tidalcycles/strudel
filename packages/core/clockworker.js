// eslint-disable-next-line no-undef
// TODO: swap below line with above one when firefox supports esm imports in service workers
// see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker?retiredLocale=de#browser_compatibility
// import createClock from './zyklus.mjs';

function getTime() {
  const seconds = performance.now() * 0.001;
  return seconds;
  // return Math.round(seconds * precision) / precision;
}

let num_cycles_at_cps_change = 0;
let num_ticks_since_cps_change = 0;
let num_seconds_at_cps_change = 0;
let cps = 0.5;
// {id: {started: boolean}}
const clients = new Map();
const duration = 0.1;
const channel = new BroadcastChannel('strudeltick');

const sendMessage = (type, payload) => {
  channel.postMessage({ type, payload });
};

const sendTick = (phase, duration, tick, time) => {
  const num_seconds_since_cps_change = num_ticks_since_cps_change * duration;
  const tickdeadline = phase - time;
  const lastTick = time + tickdeadline;
  const num_cycles_since_cps_change = num_seconds_since_cps_change * cps;
  const begin = num_cycles_at_cps_change + num_cycles_since_cps_change;
  const secondsSinceLastTick = time - lastTick - duration;
  const eventLength = duration * cps;
  const end = begin + eventLength;
  const cycle = begin + secondsSinceLastTick * cps;

  sendMessage('tick', {
    begin,
    end,
    cps,
    time,
    cycle,
  });
  num_ticks_since_cps_change++;
};

//create clock method from zyklus
const clock = createClock(getTime, sendTick, duration);
let started = false;

const startClock = (id) => {
  clients.set(id, { started: true });
  if (started) {
    return;
  }
  clock.start();
  started = true;
};
const stopClock = async (id) => {
  clients.set(id, { started: false });

  const otherClientStarted = Array.from(clients.values()).some((c) => c.started);
  //dont stop the clock if other instances are running...
  if (!started || otherClientStarted) {
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
        const num_seconds_since_cps_change = num_ticks_since_cps_change * duration;
        num_cycles_at_cps_change = num_cycles_at_cps_change + num_seconds_since_cps_change * cps;
        num_seconds_at_cps_change = num_seconds_at_cps_change + num_seconds_since_cps_change;
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
        startClock(message.id);
      } else {
        stopClock(message.id);
      }
      break;
    }
  }
};

self.onconnect = function (e) {
  // the incoming port
  const port = e.ports[0];

  port.addEventListener('message', function (e) {
    processMessage(e.data);
  });
  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};

// used to consistently schedule events, for use in a service worker - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/clockworker.mjs>
function createClock(
  getTime,
  callback, // called slightly before each cycle
  duration = 0.05, // duration of each cycle
  interval = 0.1, // interval between callbacks
  overlap = 0.1, // overlap between callbacks
) {
  let tick = 0; // counts callbacks
  let phase = 0; // next callback time
  let precision = 10 ** 4; // used to round phase
  let minLatency = 0.01;
  const setDuration = (setter) => (duration = setter(duration));
  overlap = overlap || interval / 2;
  const onTick = () => {
    const t = getTime();
    const lookahead = t + interval + overlap; // the time window for this tick
    if (phase === 0) {
      phase = t + minLatency;
    }
    // callback as long as we're inside the lookahead
    while (phase < lookahead) {
      phase = Math.round(phase * precision) / precision;
      phase >= t && callback(phase, duration, tick, t);
      phase < t && console.log('TOO LATE', phase); // what if latency is added from outside?
      phase += duration; // increment phase by duration
      tick++;
    }
  };
  let intervalID;
  const start = () => {
    clear(); // just in case start was called more than once
    onTick();
    intervalID = setInterval(onTick, interval * 1000);
  };
  const clear = () => intervalID !== undefined && clearInterval(intervalID);
  const pause = () => clear();
  const stop = () => {
    tick = 0;
    phase = 0;
    clear();
  };
  const getPhase = () => phase;
  // setCallback
  return { setDuration, start, stop, pause, duration, interval, getPhase, minLatency };
}
