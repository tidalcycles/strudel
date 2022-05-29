import * as strudel from '@strudel.cycles/core';
const { Pattern } = strudel;
import * as WebDirt from 'WebDirt';

let webDirt;

/*
example config:
{
    sampleMapUrl: 'EmuSP12.json',
    sampleFolder: 'EmuSP12',
}
*/
export function loadWebDirt(config) {
  webDirt = new WebDirt.WebDirt(config);
  webDirt.initializeWebAudio();
}

/**
 *
 * Uses [webdirt](https://github.com/dktr0/WebDirt) as output.
 *
 * <details>
 * <summary>show supported Webdirt controls</summary>
 *
 * - s :: String, -- name of sample bank (ie. old-style with sampleMap)
 * - n :: Int, -- number of sample within a bank (ie. old-style with sampleMap)
 * - whenPosix :: Number, -- when to play the sample, in POSIX/epoch-1970 time
 * - when :: Number, -- when to play the sample, in audio context time
 * - gain :: Number, -- clamped from 0 to 2; 1 is default and full-scale
 * - overgain :: Number, -- additional gain added to gain to go past clamp at 2
 * - pan :: Number, -- range: 0 to 1
 * - nudge :: Number, -- nudge the time of the sample forwards/backwards in seconds
 * - speed :: Number,
 * - note :: Number,
 * - begin :: Number,
 * - end :: Number,
 * - cut :: Int,
 * - shape :: Number,
 * - cutoff :: Number,
 * - resonance :: Number,
 * - hcutoff :: Number,
 * - hresonance :: Number,
 * - bandf :: Number,
 * - bandq :: Number,
 * - vowel :: String,
 * - delay :: Number,
 * - delaytime :: Number,
 * - delayfeedback :: Number,
 * - loop :: Number,
 * - crush :: Number,
 * - coarse :: Number,
 * - unit :: String
 *
 * </details>
 *
 * @name webdirt
 * @memberof Pattern
 * @returns Pattern
 * @example
 * s("bd*2 hh sd hh").n("<0 1>").webdirt()
 */
Pattern.prototype.webdirt = function () {
  // create a WebDirt object and initialize Web Audio context
  return this._withHap((hap) => {
    const onTrigger = (time, e, currentTime) => {
      if (!webDirt) {
        throw new Error('WebDirt not initialized!');
      }
      const deadline = time - currentTime;
      const { s, n = 0, ...rest } = e.value || {};
      if (!s) {
        console.warn('webdirt: no "s" was set!');
      }
      webDirt.playSample({ s, n, ...rest }, deadline);
    };
    return hap.setContext({ ...hap.context, onTrigger });
  });
};
