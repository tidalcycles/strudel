const allPorts = [];
let cps = 1;
let num_ticks_since_cps_change = 0;
let lastTick = 0; // absolute time when last tick (clock callback) happened
let lastBegin = 0; // query begin of last tick
let lastEnd = 0; // query end of last tick
let num_cycles_at_cps_change = 0;
let interval = 0.1;
let started = false;

//incoming
//cps message
// {type: 'cpschange', payload: {cps}}

//toggle
// {type: toggle, payload?: {started: boolean}}

//sending
//{type: 'tick', payload: {begin, end, tickdeadline, cps, time }}
//{type: 'log', payload: {type, text}}

const getTime = () => {
  return performance.now() / 1000;
};

const sendMessage = (type, payload) => {
  allPorts.forEach((port) => {
    port.postMessage({ type, payload });
  });
};
const log = (text, type) => {
  sendMessage('log', { text, type });
};

const numClientsConnected = () => allPorts.length;

const getCycle = () => {
  const secondsSinceLastTick = getTime() - lastTick - clock.duration;
  const cycle = lastBegin + secondsSinceLastTick * cps;
  return cycle;
};
// let prevtime = 0;
let clock = createClock(
  getTime,
  // called slightly before each cycle
  (phase, duration, tick) => {
    if (num_ticks_since_cps_change === 0) {
      num_cycles_at_cps_change = lastEnd;
    }
    num_ticks_since_cps_change++;
    // const now = Date.now();
    // console.log('interval', now - prevtime);
    // prevtime = now;
    try {
      const time = getTime();
      const begin = lastEnd;
      lastBegin = begin;
      //convert ticks to cycles, so you can query the pattern for events
      const eventLength = duration * cps;
      const num_cycles_since_cps_change = num_ticks_since_cps_change * eventLength;
      const end = num_cycles_at_cps_change + num_cycles_since_cps_change;
      lastEnd = end;
      const tickdeadline = phase - time; // time left until the phase is a whole number
      lastTick = time + tickdeadline;
      sendMessage('tick', { begin, end, tickdeadline, cps, cycle: getCycle() });
    } catch (e) {
      log(`[cyclist] error: ${e.message}`, 'error');
    }
  },
  interval, // duration of each cycle
);

self.onconnect = function (e) {
  // the incoming port
  const port = e.ports[0];
  allPorts.push(port);
  port.addEventListener('message', function (e) {
    processMessage(e.data);
  });
  port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
};

const processMessage = (message) => {
  const { type, payload } = message;

  switch (type) {
    case 'cpschange': {
      if (payload.cps !== cps) {
        cps = payload.cps;
        num_ticks_since_cps_change = 0;
      }
      break;
    }
    case 'toggle': {
      if (payload.started && !started) {
        started = true;
        clock.start();
        //dont stop the clock if others are using it...
      } else if (numClientsConnected() === 1) {
        started = false;
        clock.stop();
      }
      break;
    }
  }
};

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
      phase >= t && callback(phase, duration, tick);
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

  return { setDuration, start, stop, pause, duration, interval, getPhase, minLatency };
}
