// used to consistently schedule events
const createClock = (
  getTime,
  callback, // called slightly before each cycle
  duration = 0.05, // duration of each cycle
  interval = 0.1, // interval between callbacks
  overlap = 0.1, // overlap between callbacks
) => {
  let tick = 0; // counts callbacks
  let phase = 0; // next callback time
  let precision = 10 ** 4; // used to round phase
  let minLatency = 0;
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
      // phase = Math.round(phase * precision) / precision;
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
};

onmessage = async function (e) {
  console.log('Worker: Message received from main script', e);

  /* const { seq } = await import('@strudel/core');
  let pat = seq('bd').fast(4).s(); */
  if (!e.data.origin) {
    console.log('no origin');
    return;
  }
  console.log('start!', e.data.origin);
  // e.data.origin = unix ms when main document was created
  // performance.timeOrigin = unix ms when worker was created
  let originDiff = (performance.timeOrigin - e.data.origin) / 1000;
  let firstTick;
  console.log('originDiff', originDiff);

  let precision = 10 ** 4;
  let cps = 0.5;
  let interval = 0.05;
  let tickOrigin;
  let lastEnd = 0;
  let bag = [];
  let clock = createClock(
    () => performance.now() / 1000,
    (phase, duration, tick, t) => {
      if (tick === 0) {
        firstTick = t;
        console.log('firstTick', t);
      }
      // let durationInCycles = duration * cps;
      /* phase = lastEnd; */
      // phase = Math.round(phase * precision) / precision;

      bag.push({ tick, duration, phase, cps, origin: performance.timeOrigin });
      //postMessage({ tick, phase, cps, origin: performance.timeOrigin });
      let pack = 4;
      if (bag.length === pack) {
        console.log('send', performance.now());
        postMessage(bag);
        bag = [];
      }

      /* phase += duration;
      lastEnd = phase; */
      /*if (tick === 0) {
        tickOrigin = performance.now();
      }
      let begin = lastEnd || 0;
      let end = begin + duration * cps;
      lastEnd = end;
      //console.log('query', begin, phase);
      const haps = pat.queryArc(begin, end).filter((hap) => hap.hasOnset()); 
      if (haps.length) {
        postMessage({ tick, phase, begin, end, haps, cps, tickOrigin, origin: performance.timeOrigin });
      }
      */
      /* console.log(
        'tick',
        phase,
        `${begin.toFixed(2)}-${end.toFixed(2)}: ${haps
          .map((h) => `${h.value.s}:${(h.whole.begin + 0).toFixed(2)}`)
          .join(' ')}`,
      ); */
    },
    interval,
    interval,
  );
  clock.start();
};
