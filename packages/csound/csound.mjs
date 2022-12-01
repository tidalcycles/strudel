import { getFrequency, logger, Pattern } from '@strudel.cycles/core';
import { Csound } from '@csound/browser'; // TODO: use dynamic import for code splitting..
import { getAudioContext } from '@strudel.cycles/webaudio';
import csd from './sounds.csd?raw';

let csoundLoader, _csound;

// triggers given instrument name using csound. expects csound function to be called in advance `await csound()`
Pattern.prototype._csound = function (instrument) {
  instrument = instrument || 'triangle';
  return this.onTrigger((time, hap, currentTime) => {
    if (!_csound) {
      logger('[csound] not loaded yet', 'warning');
      return;
    }
    let { gain = 0.8 } = hap.value;
    gain *= 0.2;

    // const midi = toMidi(getPlayableNoteValue(hap));
    const freq = getFrequency(hap);
    // TODO: find out how to send a precise ctx based time
    // http://www.csounds.com/manual/html/i.html
    const params = [
      `"${instrument}"`, // p1: instrument name
      time - getAudioContext().currentTime, //.toFixed(precision), // p2: starting time in arbitrary unit called beats
      hap.duration + 0, // p3: duration in beats
      // instrument specific params:
      freq, //.toFixed(precision), // p4: frequency
      // -48 + gain * 24, // p5: gain
      gain, // p5: gain
    ];
    const msg = `i ${params.join(' ')}`;
    _csound.inputMessage(msg);
  });
};

// initializes csound + can be used to reevaluate given instrument code
export async function csound(code = '') {
  csoundLoader = csoundLoader || init();
  await csoundLoader;
  code && (await _csound?.evalCode(`${code}`));
  //                               ^       ^
  // wrapping in backticks makes sure it works when calling as templated function
}

Pattern.prototype.define('csound', (a, pat) => pat.csound(a), { composable: false, patternified: true });

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

async function init() {
  _csound = await Csound({ audioContext: getAudioContext() });
  _csound.removeAllListeners('message');
  ['message'].forEach((k) => _csound.on(k, (...args) => eventLogger(k, args)));
  await _csound.setOption('-m0'); // see -m flag https://csound.com/docs/manual/CommandFlags.html
  await _csound.setOption('--sample-accurate');
  await _csound.compileCsdText(csd);
  await _csound.start();
  return _csound;
}

// experimental: allows using jsx to eval csound
window.jsxPragma = function (fn, args, text) {
  return fn(text);
};

// experimental: for use via JSX as <CsInstruments>...</CsInstruments>
export function CsInstruments(text) {
  if (Array.isArray(text)) {
    text = text[0];
  }
  return csound(text);
}
