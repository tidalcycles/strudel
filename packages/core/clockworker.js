function getTime(precision) {
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
const stopClock = async () => {
  console.log(numPorts);
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

self.onconnect = function (e) {
  // the incoming port
  const port = e.ports[0];
  numPorts = numPorts + 1;
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
