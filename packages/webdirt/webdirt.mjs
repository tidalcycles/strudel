import * as strudel from '@strudel.cycles/core';
const { Pattern } = strudel;
import * as WebDirt from 'WebDirt';
import { getLoadedSamples, loadBuffer } from './sampler.mjs';

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
 * - s :: String, -- name of sample bank
 * - n :: Int, -- number of sample within a bank
 * - {@link gain} :: Number, -- clamped from 0 to 2; 1 is default and full-scale
 * - overgain :: Number, -- additional gain added to gain to go past clamp at 2
 * - {@link pan} :: Number, -- range: 0 to 1
 * - nudge :: Number, -- nudge the time of the sample forwards/backwards in seconds
 * - {@link speed} :: Number, -- speed / pitch of the sample
 * - {@link unit} :: String
 * - note :: Number, -- pitch offset in semitones
 * - {@link begin} :: Number, -- cut from sample start, normalized
 * - {@link end} :: Number, -- cut from sample end, normalized
 * - {@link cut} :: Int, -- samples with same cut number will interupt each other
 * - {@link cutoff} :: Number, -- lowpass filter frequency
 * - {@link resonance} :: Number, -- lowpass filter resonance
 * - {@link hcutoff} :: Number, -- highpass filter frequency
 * - {@link hresonance} :: Number, -- highpass filter resonance
 * - {@link bandf} :: Number, -- bandpass filter frequency
 * - {@link bandq} :: Number, -- bandpass filter resonance
 * - {@link vowel} :: String, -- name of vowel ('a' | 'e' | 'i' | 'o' | 'u')
 * - delay :: Number, -- delay wet/dry mix
 * - delaytime :: Number, -- delay time in seconds
 * - delayfeedback :: Number, -- delay feedback
 * - {@link loop} :: Number, -- loop sample n times (relative to sample length)
 * - {@link crush} :: Number, -- bitcrusher (currently not working)
 * - {@link coarse} :: Number, -- coarse effect (currently not working)
 * - {@link shape} :: Number, -- (currently not working)

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
    const onTrigger = async (time, e, currentTime) => {
      if (!webDirt) {
        throw new Error('WebDirt not initialized!');
      }
      const deadline = time - currentTime;
      const { s, n = 0, ...rest } = e.value || {};
      if (!s) {
        console.warn('webdirt: no "s" was set!');
      }
      const samples = getLoadedSamples();
      if (!samples?.[s]) {
        // try default samples
        webDirt.playSample({ s, n, ...rest }, deadline);
        return;
      }
      if (!samples?.[s]) {
        console.warn(`webdirt: sample "${s}" not found in loaded samples`, samples);
      } else {
        const bank = samples[s];
        const sampleUrl = bank[n % bank.length];
        const buffer = await loadBuffer(sampleUrl, webDirt.ac);
        const msg = { buffer: { buffer }, ...rest };
        webDirt.playSample(msg, deadline);
      }
    };
    return hap.setContext({ ...hap.context, onTrigger });
  });
};
