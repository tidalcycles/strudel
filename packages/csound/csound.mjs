import { getFrequency, logger, Pattern } from '@strudel.cycles/core';
import { Csound } from '@csound/browser'; // TODO: use dynamic import for code splitting..
import { csd } from './csd.mjs';
import { getAudioContext } from '@strudel.cycles/webaudio';

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
      time - currentTime, //.toFixed(precision), // p2: starting time in arbitrary unit called beats
      hap.duration + 0, // p3: duration in beats
      // instrument specific params:
      freq, //.toFixed(precision), // p4: frequency
      // -48 + gain * 24, // p5: gain
      gain, // p5: gain
    ];
    const msg = `i ${params.join(' ')}`;
    // console.log('msg', msg);
    _csound.inputMessage(msg);
    // _csound.readScore(msg); // slower alternative
    // even slower alternative:
    /* const code = `schedule(${params.join(', ')})`;
    _csound.evalCode(code); */
  });
};

// initializes csound + can be used to reevaluate given instrument code
export async function csound(code = '') {
  code = csd(code);
  let isInit = false;
  if (!csoundLoader) {
    isInit = true;
    csoundLoader = (async () => {
      _csound = await Csound({ audioContext: getAudioContext() });
      await _csound.setOption('-m0');
      await _csound.compileCsdText(code);
      await _csound.start();
    })();
  }
  await csoundLoader;
  !isInit && (await _csound?.compileCsdText(code));
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

Pattern.prototype.define('csound', (a, pat) => pat.csound(a), { composable: false, patternified: true });
