import { getFrequency, logger, register } from '@strudel/core';
import { getAudioContext } from '@strudel/webaudio';
import csd from './project.csd?raw';
// import livecodeOrc from './livecode.orc?raw';
import presetsOrc from './presets.orc?raw';

let csoundLoader, _csound;

// initializes csound + can be used to reevaluate given instrument code
export async function loadCSound(code = '') {
  await init();
  if (code) {
    code = `${code}`;
    //     ^       ^
    // wrapping in backticks makes sure it works when calling as templated function
    await _csound?.evalCode(code);
  }
}
export const loadcsound = loadCSound;
export const loadCsound = loadCSound;

export const csound = register('csound', (instrument, pat) => {
  instrument = instrument || 'triangle';
  init(); // not async to support csound inside other patterns + to be able to call pattern methods after it
  // TODO: find a alternative way to wait for csound to load (to wait with first time playback)
  return pat.onTrigger((time_deprecate, hap, currentTime, _cps, targetTime) => {
    if (!_csound) {
      logger('[csound] not loaded yet', 'warning');
      return;
    }
    hap.ensureObjectValue();
    let { gain = 0.8 } = hap.value;
    gain *= 0.2;

    const freq = Math.round(getFrequency(hap));
    const controls = Object.entries({ ...hap.value, freq })
      .flat()
      .join('/');
    // TODO: find out how to send a precise ctx based time
    // http://www.csounds.com/manual/html/i.html
    const timeOffset = targetTime - currentTime; // latency ?
    //const timeOffset = time_deprecate - getAudioContext().currentTime
    const params = [
      `"${instrument}"`, // p1: instrument name
      timeOffset, // p2: starting time in arbitrary unit called beats
      hap.duration + 0, // p3: duration in beats
      // instrument specific params:
      freq, //.toFixed(precision), // p4: frequency
      gain, // p5: gain
      `"${controls}"`, // p6 controls as string (like superdirt osc message)
    ];
    const msg = `i ${params.join(' ')}`;
    _csound.inputMessage(msg);
  });
});

function eventLogger(type, args) {
  const [msg] = args;
  if (
    type === 'message' &&
    (['[commit: HEAD]'].includes(msg) ||
      msg.startsWith('--Csound version') ||
      msg.startsWith('libsndfile') ||
      msg.startsWith('sr =') ||
      msg.startsWith('0dBFS') ||
      msg.startsWith('audio buffered') ||
      msg.startsWith('writing') ||
      msg.startsWith('SECTION 1:'))
  ) {
    // ignore
    return;
  }
  let logType = 'info';
  if (msg.startsWith('error:')) {
    logType = 'error';
  }
  logger(`[csound] ${msg || ''}`, logType);
}

async function load() {
  if (window.__csound__) {
    // Allows using some other csound instance.
    // In that case, the external Csound is responsible
    // for compiling an orchestra and starting to perform.
    logger('[load] Using external Csound', 'warning');
    _csound = window.__csound__;
    return _csound;
  } else {
    const { Csound } = await import('@csound/browser');
    _csound = await Csound({ audioContext: getAudioContext() });
    _csound.removeAllListeners('message');
    ['message'].forEach((k) => _csound.on(k, (...args) => eventLogger(k, args)));
    await _csound.setOption('-m0d'); // see -m flag https://csound.com/docs/manual/CommandFlags.html
    await _csound.setOption('--sample-accurate');
    await _csound.setOption('-odac');
    await _csound.compileCsdText(csd);
    // await _csound.compileOrc(livecodeOrc);
    await _csound.compileOrc(presetsOrc);
    await _csound.start();
    return _csound;
  }
}

async function init() {
  csoundLoader = csoundLoader || load();
  return csoundLoader;
}

let orcCache = {};
export async function loadOrc(url) {
  await init();
  if (typeof url !== 'string') {
    throw new Error('loadOrc: expected url string');
  }
  if (url.startsWith('github:')) {
    const [_, path] = url.split('github:');
    url = `https://raw.githubusercontent.com/${path}`;
  }
  if (!orcCache[url]) {
    orcCache[url] = fetch(url)
      .then((res) => res.text())
      .then((code) => _csound.compileOrc(code));
  }
  await orcCache[url];
}

/**
 * Sends notes to Csound for rendering with MIDI semantics. The hap value is
 * translated to these Csound pfields:
 *
 *  p1 -- Csound instrument either as a number (1-based, can be a fraction),
 *        or as a string name.
 *  p2 -- time in beats (usually seconds) from start of performance.
 *  p3 -- duration in beats (usually seconds).
 *  p4 -- MIDI key number (as a real number, not an integer but in [0, 127].
 *  p5 -- MIDI velocity (as a real number, not an integer but in [0, 127].
 *  p6 -- Strudel controls, as a string.
 */
export const csoundm = register('csoundm', (instrument, pat) => {
  let p1 = instrument;
  if (typeof instrument === 'string') {
    p1 = `"${instrument}"`;
  }
  init(); // not async to support csound inside other patterns + to be able to call pattern methods after it
  return pat.onTrigger((tidal_time, hap) => {
    if (!_csound) {
      logger('[csound] not loaded yet', 'warning');
      return;
    }
    if (typeof hap.value !== 'object') {
      throw new Error('csound only support objects as hap values');
    }
    // Time in seconds counting from now.
    const p2 = tidal_time - getAudioContext().currentTime;
    const p3 = hap.duration.valueOf() + 0;
    const frequency = getFrequency(hap);
    let { gain = 1, velocity = 0.9 } = hap.value;
    velocity = gain * velocity;
    // Translate frequency to MIDI key number _without_ rounding.
    const C4 = 261.62558;
    let octave = Math.log(frequency / C4) / Math.log(2.0) + 8.0;
    const p4 = octave * 12.0 - 36.0;
    // We prefer floating point precision, but over the MIDI range [0, 127].
    const p5 = 127 * velocity;
    // The Strudel controls as a string.
    const p6 = Object.entries({ ...hap.value, frequency })
      .flat()
      .join('/');
    const i_statement = `i ${p1} ${p2} ${p3} ${p4} ${p5} "${p6}"`;
    console.log('[csoundm]:', i_statement);
    _csound.inputMessage(i_statement);
  });
});
