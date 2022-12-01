import { getFrequency, logger, Pattern } from '@strudel.cycles/core';
import { getAudioContext } from '@strudel.cycles/webaudio';
import csd from './project.csd?raw';
import livecodeOrc from './livecode.orc?raw';
import presetsOrc from './presets.orc?raw';

let csoundLoader, _csound;

// triggers given instrument name using csound.
Pattern.prototype._csound = function (instrument) {
  instrument = instrument || 'triangle';
  init(); // not async to support csound inside other patterns + to be able to call pattern methods after it
  // TODO: find a alternative way to wait for csound to load (to wait with first time playback)
  return this.onTrigger((time, hap) => {
    if (!_csound) {
      logger('[csound] not loaded yet', 'warning');
      return;
    }
    let { gain = 0.8 } = hap.value;
    gain *= 0.2;

    const freq = getFrequency(hap);
    // TODO: find out how to send a precise ctx based time
    // http://www.csounds.com/manual/html/i.html
    const params = [
      `"${instrument}"`, // p1: instrument name
      time - getAudioContext().currentTime, //.toFixed(precision), // p2: starting time in arbitrary unit called beats
      hap.duration + 0, // p3: duration in beats
      // instrument specific params:
      freq, //.toFixed(precision), // p4: frequency
      gain, // p5: gain
    ];
    const msg = `i ${params.join(' ')}`;
    _csound.inputMessage(msg);
  });
};

// initializes csound + can be used to reevaluate given instrument code
export async function csound(code = '') {
  await init();
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

async function load() {
  const { Csound } = await import('@csound/browser');
  _csound = await Csound({ audioContext: getAudioContext() });
  _csound.removeAllListeners('message');
  ['message'].forEach((k) => _csound.on(k, (...args) => eventLogger(k, args)));
  await _csound.setOption('-m0'); // see -m flag https://csound.com/docs/manual/CommandFlags.html
  await _csound.setOption('--sample-accurate');
  await _csound.compileCsdText(csd);
  await _csound.compileOrc(livecodeOrc);
  await _csound.compileOrc(presetsOrc);
  await _csound.start();
  return _csound;
}

async function init() {
  csoundLoader = csoundLoader || load();
  return csoundLoader;
}
