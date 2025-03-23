/*
controls.mjs - Registers audio controls for pattern manipulation and effects.
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/controls.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, register, sequence } from './pattern.mjs';

export function createParam(names) {
  let isMulti = Array.isArray(names);
  names = !isMulti ? [names] : names;
  const name = names[0];

  const withVal = (xs) => {
    let bag;
    // check if we have an object with an unnamed control (.value)
    if (typeof xs === 'object' && xs.value !== undefined) {
      bag = { ...xs }; // grab props that are already there
      xs = xs.value; // grab the unnamed control for this one
      delete bag.value;
    }
    if (isMulti && Array.isArray(xs)) {
      const result = bag || {};
      xs.forEach((x, i) => {
        if (i < names.length) {
          result[names[i]] = x;
        }
      });
      return result;
    } else if (bag) {
      bag[name] = xs;
      return bag;
    } else {
      return { [name]: xs };
    }
  };

  const func = (...pats) => sequence(...pats).withValue(withVal);

  const setter = function (...pats) {
    if (!pats.length) {
      return this.fmap(withVal);
    }
    return this.set(func(...pats));
  };
  Pattern.prototype[name] = setter;
  return func;
}

// maps control alias names to the "main" control name
const controlAlias = new Map();

export function registerControl(names, ...aliases) {
  const name = Array.isArray(names) ? names[0] : names;
  let bag = {};
  bag[name] = createParam(names);
  aliases.forEach((alias) => {
    bag[alias] = bag[name];
    controlAlias.set(alias, name);
    Pattern.prototype[alias] = Pattern.prototype[name];
  });
  return bag;
}

/**
 * Select a sound / sample by name. When using mininotation, you can also optionally supply 'n' and 'gain' parameters
 * separated by ':'.
 *
 * @name s
 * @param {string | Pattern} sound The sound / pattern of sounds to pick
 * @synonyms sound
 * @example
 * s("bd hh")
 * @example
 * s("bd:0 bd:1 bd:0:0.3 bd:1:1.4")
 *
 */
export const { s, sound } = registerControl(['s', 'n', 'gain'], 'sound');

/**
 * Define a custom webaudio node to use as a sound source.
 *
 * @name source
 * @param {function} getSource
 * @synonyms src
 *
 */
export const { source, src } = registerControl('source', 'src');
/**
 * Selects the given index from the sample map.
 * Numbers too high will wrap around.
 * `n` can also be used to play midi numbers, but it is recommended to use `note` instead.
 *
 * @name n
 * @param {number | Pattern} value sample index starting from 0
 * @example
 * s("bd sd [~ bd] sd,hh*6").n("<0 1>")
 */
// also see https://github.com/tidalcycles/strudel/pull/63
export const { n } = registerControl('n');
/**
 * Plays the given note name or midi number. A note name consists of
 *
 * - a letter (a-g or A-G)
 * - optional accidentals (b or #)
 * - optional octave number (0-9). Defaults to 3
 *
 * Examples of valid note names: `c`, `bb`, `Bb`, `f#`, `c3`, `A4`, `Eb2`, `c#5`
 *
 * You can also use midi numbers instead of note names, where 69 is mapped to A4 440Hz in 12EDO.
 *
 * @name note
 * @example
 * note("c a f e")
 * @example
 * note("c4 a4 f4 e4")
 * @example
 * note("60 69 65 64")
 */
export const { note } = registerControl(['note', 'n']);

/**
 * A pattern of numbers that speed up (or slow down) samples while they play. Currently only supported by osc / superdirt.
 *
 * @name accelerate
 * @param {number | Pattern} amount acceleration.
 * @superdirtOnly
 * @example
 * s("sax").accelerate("<0 1 2 4 8 16>").slow(2).osc()
 *
 */
export const { accelerate } = registerControl('accelerate');
/**
 *
 * Sets the velocity from 0 to 1. Is multiplied together with gain.
 * @name velocity
 * @example
 * s("hh*8")
 * .gain(".4!2 1 .4!2 1 .4 1")
 * .velocity(".4 1")
 */
export const { velocity } = registerControl('velocity');
/**
 * Controls the gain by an exponential amount.
 *
 * @name gain
 * @param {number | Pattern} amount gain.
 * @example
 * s("hh*8").gain(".4!2 1 .4!2 1 .4 1").fast(2)
 *
 */
export const { gain } = registerControl('gain');
/**
 * Gain applied after all effects have been processed.
 *
 * @name postgain
 * @example
 * s("bd sd [~ bd] sd,hh*8")
 * .compressor("-20:20:10:.002:.02").postgain(1.5)
 *
 */
export const { postgain } = registerControl('postgain');
/**
 * Like `gain`, but linear.
 *
 * @name amp
 * @param {number | Pattern} amount gain.
 * @superdirtOnly
 * @example
 * s("bd*8").amp(".1*2 .5 .1*2 .5 .1 .5").osc()
 *
 */
export const { amp } = registerControl('amp');
/**
 * Amplitude envelope attack time: Specifies how long it takes for the sound to reach its peak value, relative to the onset.
 *
 * @name attack
 * @param {number | Pattern} attack time in seconds.
 * @synonyms att
 * @example
 * note("c3 e3 f3 g3").attack("<0 .1 .5>")
 *
 */
export const { attack, att } = registerControl('attack', 'att');

/**
 * Sets the Frequency Modulation Harmonicity Ratio.
 * Controls the timbre of the sound.
 * Whole numbers and simple ratios sound more natural,
 * while decimal numbers and complex ratios sound metallic.
 *
 * @name fmh
 * @param {number | Pattern} harmonicity
 * @example
 * note("c e g b g e")
 * .fm(4)
 * .fmh("<1 2 1.5 1.61>")
 * ._scope()
 *
 */
export const { fmh } = registerControl(['fmh', 'fmi'], 'fmh');
/**
 * Sets the Frequency Modulation of the synth.
 * Controls the modulation index, which defines the brightness of the sound.
 *
 * @name fm
 * @param {number | Pattern} brightness modulation index
 * @synonyms fmi
 * @example
 * note("c e g b g e")
 * .fm("<0 1 2 8 32>")
 * ._scope()
 *
 */
export const { fmi, fm } = registerControl(['fmi', 'fmh'], 'fm');
// fm envelope
/**
 * Ramp type of fm envelope. Exp might be a bit broken..
 *
 * @name fmenv
 * @param {number | Pattern} type lin | exp
 * @example
 * note("c e g b g e")
 * .fm(4)
 * .fmdecay(.2)
 * .fmsustain(0)
 * .fmenv("<exp lin>")
 * ._scope()
 *
 */
export const { fmenv } = registerControl('fmenv');
/**
 * Attack time for the FM envelope: time it takes to reach maximum modulation
 *
 * @name fmattack
 * @param {number | Pattern} time attack time
 * @example
 * note("c e g b g e")
 * .fm(4)
 * .fmattack("<0 .05 .1 .2>")
 * ._scope()
 *
 */
export const { fmattack } = registerControl('fmattack');
/**
 * Decay time for the FM envelope: seconds until the sustain level is reached after the attack phase.
 *
 * @name fmdecay
 * @param {number | Pattern} time decay time
 * @example
 * note("c e g b g e")
 * .fm(4)
 * .fmdecay("<.01 .05 .1 .2>")
 * .fmsustain(.4)
 * ._scope()
 *
 */
export const { fmdecay } = registerControl('fmdecay');
/**
 * Sustain level for the FM envelope: how much modulation is applied after the decay phase
 *
 * @name fmsustain
 * @param {number | Pattern} level sustain level
 * @example
 * note("c e g b g e")
 * .fm(4)
 * .fmdecay(.1)
 * .fmsustain("<1 .75 .5 0>")
 * ._scope()
 *
 */
export const { fmsustain } = registerControl('fmsustain');
// these are not really useful... skipping for now
export const { fmrelease } = registerControl('fmrelease');
export const { fmvelocity } = registerControl('fmvelocity');

/**
 * Select the sound bank to use. To be used together with `s`. The bank name (+ "_") will be prepended to the value of `s`.
 *
 * @name bank
 * @param {string | Pattern} bank the name of the bank
 * @example
 * s("bd sd [~ bd] sd").bank('RolandTR909') // = s("RolandTR909_bd RolandTR909_sd")
 *
 */
export const { bank } = registerControl('bank');

// analyser node send amount 0 - 1 (used by scope)
export const { analyze } = registerControl('analyze');
// fftSize of analyser
export const { fft } = registerControl('fft');

/**
 * Amplitude envelope decay time: the time it takes after the attack time to reach the sustain level.
 * Note that the decay is only audible if the sustain value is lower than 1.
 *
 * @name decay
 * @param {number | Pattern} time decay time in seconds
 * @example
 * note("c3 e3 f3 g3").decay("<.1 .2 .3 .4>").sustain(0)
 *
 */
export const { decay, dec } = registerControl('decay', 'dec');
/**
 * Amplitude envelope sustain level: The level which is reached after attack / decay, being sustained until the offset.
 *
 * @name sustain
 * @param {number | Pattern} gain sustain level between 0 and 1
 * @synonyms sus
 * @example
 * note("c3 e3 f3 g3").decay(.2).sustain("<0 .1 .4 .6 1>")
 *
 */
export const { sustain, sus } = registerControl('sustain', 'sus');
/**
 * Amplitude envelope release time: The time it takes after the offset to go from sustain level to zero.
 *
 * @name release
 * @param {number | Pattern} time release time in seconds
 * @synonyms rel
 * @example
 * note("c3 e3 g3 c4").release("<0 .1 .4 .6 1>/2")
 *
 */
export const { release, rel } = registerControl('release', 'rel');
export const { hold } = registerControl('hold');
// TODO: in tidal, it seems to be normalized
/**
 * Sets the center frequency of the **b**and-**p**ass **f**ilter. When using mininotation, you
 * can also optionally supply the 'bpq' parameter separated by ':'.
 *
 * @name bpf
 * @param {number | Pattern} frequency center frequency
 * @synonyms bandf, bp
 * @example
 * s("bd sd [~ bd] sd,hh*6").bpf("<1000 2000 4000 8000>")
 *
 */
export const { bandf, bpf, bp } = registerControl(['bandf', 'bandq', 'bpenv'], 'bpf', 'bp');
// TODO: in tidal, it seems to be normalized
/**
 * Sets the **b**and-**p**ass **q**-factor (resonance).
 *
 * @name bpq
 * @param {number | Pattern} q q factor
 * @synonyms bandq
 * @example
 * s("bd sd [~ bd] sd").bpf(500).bpq("<0 1 2 3>")
 *
 */
// currently an alias of 'bandq' https://github.com/tidalcycles/strudel/issues/496
// ['bpq'],
export const { bandq, bpq } = registerControl('bandq', 'bpq');
/**
 * a pattern of numbers from 0 to 1. Skips the beginning of each sample, e.g. `0.25` to cut off the first quarter from each sample.
 *
 * @memberof Pattern
 * @name begin
 * @param {number | Pattern} amount between 0 and 1, where 1 is the length of the sample
 * @example
 * samples({ rave: 'rave/AREUREADY.wav' }, 'github:tidalcycles/dirt-samples')
 * s("rave").begin("<0 .25 .5 .75>").fast(2)
 *
 */
export const { begin } = registerControl('begin');
/**
 * The same as .begin, but cuts off the end off each sample.
 *
 * @memberof Pattern
 * @name end
 * @param {number | Pattern} length 1 = whole sample, .5 = half sample, .25 = quarter sample etc..
 * @example
 * s("bd*2,oh*4").end("<.1 .2 .5 1>").fast(2)
 *
 */
export const { end } = registerControl('end');
/**
 * Loops the sample.
 * Note that the tempo of the loop is not synced with the cycle tempo.
 * To change the loop region, use loopBegin / loopEnd.
 *
 * @name loop
 * @param {number | Pattern} on If 1, the sample is looped
 * @example
 * s("casio").loop(1)
 *
 */
export const { loop } = registerControl('loop');
/**
 * Begin to loop at a specific point in the sample (inbetween `begin` and `end`).
 * Note that the loop point must be inbetween `begin` and `end`, and before `loopEnd`!
 * Note: Samples starting with wt_ will automatically loop! (wt = wavetable)
 *
 * @name loopBegin
 * @param {number | Pattern} time between 0 and 1, where 1 is the length of the sample
 * @synonyms loopb
 * @example
 * s("space").loop(1)
 * .loopBegin("<0 .125 .25>")._scope()
 */
export const { loopBegin, loopb } = registerControl('loopBegin', 'loopb');
/**
 *
 * End the looping section at a specific point in the sample (inbetween `begin` and `end`).
 * Note that the loop point must be inbetween `begin` and `end`, and after `loopBegin`!
 *
 * @name loopEnd
 * @param {number | Pattern} time between 0 and 1, where 1 is the length of the sample
 * @synonyms loope
 * @example
 * s("space").loop(1)
 * .loopEnd("<1 .75 .5 .25>")._scope()
 */
export const { loopEnd, loope } = registerControl('loopEnd', 'loope');
/**
 * bit crusher effect.
 *
 * @name crush
 * @param {number | Pattern} depth between 1 (for drastic reduction in bit-depth) to 16 (for barely no reduction).
 * @example
 * s("<bd sd>,hh*3").fast(2).crush("<16 8 7 6 5 4 3 2>")
 *
 */
// ['clhatdecay'],
export const { crush } = registerControl('crush');
/**
 * fake-resampling for lowering the sample rate. Caution: This effect seems to only work in chromium based browsers
 *
 * @name coarse
 * @param {number | Pattern} factor 1 for original 2 for half, 3 for a third and so on.
 * @example
 * s("bd sd [~ bd] sd,hh*8").coarse("<1 4 8 16 32>")
 *
 */
export const { coarse } = registerControl('coarse');

/**
 * filter overdrive for supported filter types
 *
 * @name drive
 * @param {number | Pattern} amount
 * @example
 * note("{f g g c d a a#}%16".sub(17)).s("supersaw").lpenv(8).lpf(150).lpq(.8).ftype('ladder').drive("<.5 4>")
 *
 */
export const { drive } = registerControl('drive');

/**
 * Allows you to set the output channels on the interface
 *
 * @name channels
 * @synonyms ch
 *
 * @param {number | Pattern} channels pattern the output channels
 * @example
 * note("e a d b g").channels("3:4")
 *
 */
export const { channels, ch } = registerControl('channels', 'ch');

/**
 * Phaser audio effect that approximates popular guitar pedals.
 *
 * @name phaser
 * @synonyms ph
 * @param {number | Pattern} speed speed of modulation
 * @example
 * n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
 * .phaser("<1 2 4 8>")
 *
 */
export const { phaserrate, ph, phaser } = registerControl(
  ['phaserrate', 'phaserdepth', 'phasercenter', 'phasersweep'],
  'ph',
  'phaser',
);

/**
 * The frequency sweep range of the lfo for the phaser effect. Defaults to 2000
 *
 * @name phasersweep
 * @synonyms phs
 * @param {number | Pattern} phasersweep most useful values are between 0 and 4000
 * @example
 * n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
 * .phaser(2).phasersweep("<800 2000 4000>")
 *
 */
export const { phasersweep, phs } = registerControl('phasersweep', 'phs');

/**
 *  The center frequency of the phaser in HZ. Defaults to 1000
 *
 * @name phasercenter
 * @synonyms phc
 * @param {number | Pattern} centerfrequency in HZ
 * @example
 * n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
 * .phaser(2).phasercenter("<800 2000 4000>")
 *
 */

export const { phasercenter, phc } = registerControl('phasercenter', 'phc');

/**
 * The amount the signal is affected by the phaser effect. Defaults to 0.75
 *
 * @name phaserdepth
 * @synonyms phd
 * @param {number | Pattern} depth number between 0 and 1
 * @example
 * n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
 * .phaser(2).phaserdepth("<0 .5 .75 1>")
 *
 */
// also a superdirt control
export const { phaserdepth, phd, phasdp } = registerControl('phaserdepth', 'phd', 'phasdp');

/**
 * choose the channel the pattern is sent to in superdirt
 *
 * @name channel
 * @param {number | Pattern} channel channel number
 *
 */
export const { channel } = registerControl('channel');
/**
 * In the style of classic drum-machines, `cut` will stop a playing sample as soon as another samples with in same cutgroup is to be played. An example would be an open hi-hat followed by a closed one, essentially muting the open.
 *
 * @name cut
 * @param {number | Pattern} group cut group number
 * @example
 * s("[oh hh]*4").cut(1)
 *
 */
export const { cut } = registerControl('cut');
/**
 * Applies the cutoff frequency of the **l**ow-**p**ass **f**ilter.
 *
 * When using mininotation, you can also optionally add the 'lpq' parameter, separated by ':'.
 *
 * @name lpf
 * @param {number | Pattern} frequency audible between 0 and 20000
 * @synonyms cutoff, ctf, lp
 * @example
 * s("bd sd [~ bd] sd,hh*6").lpf("<4000 2000 1000 500 200 100>")
 * @example
 * s("bd*16").lpf("1000:0 1000:10 1000:20 1000:30")
 *
 */
export const { cutoff, ctf, lpf, lp } = registerControl(['cutoff', 'resonance', 'lpenv'], 'ctf', 'lpf', 'lp');

/**
 * Sets the lowpass filter envelope modulation depth.
 * @name lpenv
 * @param {number | Pattern} modulation depth of the lowpass filter envelope between 0 and _n_
 * @synonyms lpe
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .lpf(300)
 * .lpa(.5)
 * .lpenv("<4 2 1 0 -1 -2 -4>/4")
 */
export const { lpenv, lpe } = registerControl('lpenv', 'lpe');
/**
 * Sets the highpass filter envelope modulation depth.
 * @name hpenv
 * @param {number | Pattern} modulation depth of the highpass filter envelope between 0 and _n_
 * @synonyms hpe
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .hpf(500)
 * .hpa(.5)
 * .hpenv("<4 2 1 0 -1 -2 -4>/4")
 */
export const { hpenv, hpe } = registerControl('hpenv', 'hpe');
/**
 * Sets the bandpass filter envelope modulation depth.
 * @name bpenv
 * @param {number | Pattern} modulation depth of the bandpass filter envelope between 0 and _n_
 * @synonyms bpe
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .bpf(500)
 * .bpa(.5)
 * .bpenv("<4 2 1 0 -1 -2 -4>/4")
 */
export const { bpenv, bpe } = registerControl('bpenv', 'bpe');
/**
 * Sets the attack duration for the lowpass filter envelope.
 * @name lpattack
 * @param {number | Pattern} attack time of the filter envelope
 * @synonyms lpa
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .lpf(300)
 * .lpa("<.5 .25 .1 .01>/4")
 * .lpenv(4)
 */
export const { lpattack, lpa } = registerControl('lpattack', 'lpa');
/**
 * Sets the attack duration for the highpass filter envelope.
 * @name hpattack
 * @param {number | Pattern} attack time of the highpass filter envelope
 * @synonyms hpa
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .hpf(500)
 * .hpa("<.5 .25 .1 .01>/4")
 * .hpenv(4)
 */
export const { hpattack, hpa } = registerControl('hpattack', 'hpa');
/**
 * Sets the attack duration for the bandpass filter envelope.
 * @name bpattack
 * @param {number | Pattern} attack time of the bandpass filter envelope
 * @synonyms bpa
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .bpf(500)
 * .bpa("<.5 .25 .1 .01>/4")
 * .bpenv(4)
 */
export const { bpattack, bpa } = registerControl('bpattack', 'bpa');
/**
 * Sets the decay duration for the lowpass filter envelope.
 * @name lpdecay
 * @param {number | Pattern} decay time of the filter envelope
 * @synonyms lpd
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .lpf(300)
 * .lpd("<.5 .25 .1 0>/4")
 * .lpenv(4)
 */
export const { lpdecay, lpd } = registerControl('lpdecay', 'lpd');
/**
 * Sets the decay duration for the highpass filter envelope.
 * @name hpdecay
 * @param {number | Pattern} decay time of the highpass filter envelope
 * @synonyms hpd
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .hpf(500)
 * .hpd("<.5 .25 .1 0>/4")
 * .hps(0.2)
 * .hpenv(4)
 */
export const { hpdecay, hpd } = registerControl('hpdecay', 'hpd');
/**
 * Sets the decay duration for the bandpass filter envelope.
 * @name bpdecay
 * @param {number | Pattern} decay time of the bandpass filter envelope
 * @synonyms bpd
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .bpf(500)
 * .bpd("<.5 .25 .1 0>/4")
 * .bps(0.2)
 * .bpenv(4)
 */
export const { bpdecay, bpd } = registerControl('bpdecay', 'bpd');
/**
 * Sets the sustain amplitude for the lowpass filter envelope.
 * @name lpsustain
 * @param {number | Pattern} sustain amplitude of the lowpass filter envelope
 * @synonyms lps
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .lpf(300)
 * .lpd(.5)
 * .lps("<0 .25 .5 1>/4")
 * .lpenv(4)
 */
export const { lpsustain, lps } = registerControl('lpsustain', 'lps');
/**
 * Sets the sustain amplitude for the highpass filter envelope.
 * @name hpsustain
 * @param {number | Pattern} sustain amplitude of the highpass filter envelope
 * @synonyms hps
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .hpf(500)
 * .hpd(.5)
 * .hps("<0 .25 .5 1>/4")
 * .hpenv(4)
 */
export const { hpsustain, hps } = registerControl('hpsustain', 'hps');
/**
 * Sets the sustain amplitude for the bandpass filter envelope.
 * @name bpsustain
 * @param {number | Pattern} sustain amplitude of the bandpass filter envelope
 * @synonyms bps
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .bpf(500)
 * .bpd(.5)
 * .bps("<0 .25 .5 1>/4")
 * .bpenv(4)
 */
export const { bpsustain, bps } = registerControl('bpsustain', 'bps');
/**
 * Sets the release time for the lowpass filter envelope.
 * @name lprelease
 * @param {number | Pattern} release time of the filter envelope
 * @synonyms lpr
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .clip(.5)
 * .lpf(300)
 * .lpenv(4)
 * .lpr("<.5 .25 .1 0>/4")
 * .release(.5)
 */
export const { lprelease, lpr } = registerControl('lprelease', 'lpr');
/**
 * Sets the release time for the highpass filter envelope.
 * @name hprelease
 * @param {number | Pattern} release time of the highpass filter envelope
 * @synonyms hpr
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .clip(.5)
 * .hpf(500)
 * .hpenv(4)
 * .hpr("<.5 .25 .1 0>/4")
 * .release(.5)
 */
export const { hprelease, hpr } = registerControl('hprelease', 'hpr');
/**
 * Sets the release time for the bandpass filter envelope.
 * @name bprelease
 * @param {number | Pattern} release time of the bandpass filter envelope
 * @synonyms bpr
 * @example
 * note("c2 e2 f2 g2")
 * .sound('sawtooth')
 * .clip(.5)
 * .bpf(500)
 * .bpenv(4)
 * .bpr("<.5 .25 .1 0>/4")
 * .release(.5)
 */
export const { bprelease, bpr } = registerControl('bprelease', 'bpr');
/**
 * Sets the filter type. The ladder filter is more aggressive. More types might be added in the future.
 * @name ftype
 * @param {number | Pattern} type 12db (0), ladder (1), or 24db (2)
 * @example
 * note("{f g g c d a a#}%8").s("sawtooth").lpenv(4).lpf(500).ftype("<0 1 2>").lpq(1)
 * @example
 * note("c f g g a c d4").fast(2)
 * .sound('sawtooth')
 * .lpf(200).fanchor(0)
 * .lpenv(3).lpq(1)
 * .ftype("<ladder 12db 24db>")
 */
export const { ftype } = registerControl('ftype');

/**
 * controls the center of the filter envelope. 0 is unipolar positive, .5 is bipolar, 1 is unipolar negative
 * @name fanchor
 * @param {number | Pattern} center 0 to 1
 * @example
 * note("{f g g c d a a#}%8").s("sawtooth").lpf("{1000}%2")
 * .lpenv(8).fanchor("<0 .5 1>")
 */
export const { fanchor } = registerControl('fanchor');
/**
 * Applies the cutoff frequency of the **h**igh-**p**ass **f**ilter.
 *
 * When using mininotation, you can also optionally add the 'hpq' parameter, separated by ':'.
 *
 * @name hpf
 * @param {number | Pattern} frequency audible between 0 and 20000
 * @synonyms hp, hcutoff
 * @example
 * s("bd sd [~ bd] sd,hh*8").hpf("<4000 2000 1000 500 200 100>")
 * @example
 * s("bd sd [~ bd] sd,hh*8").hpf("<2000 2000:25>")
 *
 */
// currently an alias of 'hcutoff' https://github.com/tidalcycles/strudel/issues/496
// ['hpf'],
/**
 * Applies a vibrato to the frequency of the oscillator.
 *
 * @name vib
 * @synonyms vibrato, v
 * @param {number | Pattern} frequency of the vibrato in hertz
 * @example
 * note("a e")
 * .vib("<.5 1 2 4 8 16>")
 * ._scope()
 * @example
 * // change the modulation depth with ":"
 * note("a e")
 * .vib("<.5 1 2 4 8 16>:12")
 * ._scope()
 */
export const { vib, vibrato, v } = registerControl(['vib', 'vibmod'], 'vibrato', 'v');
/**
 * Adds pink noise to the mix
 *
 * @name noise
 * @param {number | Pattern} wet wet amount
 * @example
 * sound("<white pink brown>/2")
 */
export const { noise } = registerControl('noise');
/**
 * Sets the vibrato depth in semitones. Only has an effect if `vibrato` | `vib` | `v` is is also set
 *
 * @name vibmod
 * @synonyms vmod
 * @param {number | Pattern} depth of vibrato (in semitones)
 * @example
 * note("a e").vib(4)
 * .vibmod("<.25 .5 1 2 12>")
 * ._scope()
 * @example
 * // change the vibrato frequency with ":"
 * note("a e")
 * .vibmod("<.25 .5 1 2 12>:8")
 * ._scope()
 */
export const { vibmod, vmod } = registerControl(['vibmod', 'vib'], 'vmod');
export const { hcutoff, hpf, hp } = registerControl(['hcutoff', 'hresonance', 'hpenv'], 'hpf', 'hp');
/**
 * Controls the **h**igh-**p**ass **q**-value.
 *
 * @name hpq
 * @param {number | Pattern} q resonance factor between 0 and 50
 * @synonyms hresonance
 * @example
 * s("bd sd [~ bd] sd,hh*8").hpf(2000).hpq("<0 10 20 30>")
 *
 */
export const { hresonance, hpq } = registerControl('hresonance', 'hpq');
/**
 * Controls the **l**ow-**p**ass **q**-value.
 *
 * @name lpq
 * @param {number | Pattern} q resonance factor between 0 and 50
 * @synonyms resonance
 * @example
 * s("bd sd [~ bd] sd,hh*8").lpf(2000).lpq("<0 10 20 30>")
 *
 */
// currently an alias of 'resonance' https://github.com/tidalcycles/strudel/issues/496
export const { resonance, lpq } = registerControl('resonance', 'lpq');
/**
 * DJ filter, below 0.5 is low pass filter, above is high pass filter.
 *
 * @name djf
 * @param {number | Pattern} cutoff below 0.5 is low pass filter, above is high pass filter
 * @example
 * n("0 3 7 [10,24]").s('superzow').octave(3).djf("<.5 .25 .5 .75>").osc()
 *
 */
export const { djf } = registerControl('djf');
// ['cutoffegint'],
// TODO: does not seem to work
/**
 * Sets the level of the delay signal.
 *
 * When using mininotation, you can also optionally add the 'delaytime' and 'delayfeedback' parameter,
 * separated by ':'.
 *
 *
 * @name delay
 * @param {number | Pattern} level between 0 and 1
 * @example
 * s("bd bd").delay("<0 .25 .5 1>")
 * @example
 * s("bd bd").delay("0.65:0.25:0.9 0.65:0.125:0.7")
 *
 */
export const { delay } = registerControl(['delay', 'delaytime', 'delayfeedback']);
/**
 * Sets the level of the signal that is fed back into the delay.
 * Caution: Values >= 1 will result in a signal that gets louder and louder! Don't do it
 *
 * @name delayfeedback
 * @param {number | Pattern} feedback between 0 and 1
 * @synonyms delayfb, dfb
 * @example
 * s("bd").delay(.25).delayfeedback("<.25 .5 .75 1>")
 *
 */
export const { delayfeedback, delayfb, dfb } = registerControl('delayfeedback', 'delayfb', 'dfb');
/**
 * Sets the time of the delay effect.
 *
 * @name delaytime
 * @param {number | Pattern} seconds between 0 and Infinity
 * @synonyms delayt, dt
 * @example
 * s("bd bd").delay(.25).delaytime("<.125 .25 .5 1>")
 *
 */
export const { delaytime, delayt, dt } = registerControl('delaytime', 'delayt', 'dt');
/* // TODO: test
 * Specifies whether delaytime is calculated relative to cps.
 *
 * @name lock
 * @param {number | Pattern} enable When set to 1, delaytime is a direct multiple of a cycle.
 * @example
 * s("sd").delay().lock(1).osc()
 *
 */
export const { lock } = registerControl('lock');
/**
 * Set detune for stacked voices of supported oscillators
 *
 * @name detune
 * @param {number | Pattern} amount
 * @synonyms det
 * @example
 * note("d f a a# a d3").fast(2).s("supersaw").detune("<.1 .2 .5 24.1>")
 *
 */
export const { detune, det } = registerControl('detune', 'det');
/**
 * Set number of stacked voices for supported oscillators
 *
 * @name unison
 * @param {number | Pattern} numvoices
 * @example
 * note("d f a a# a d3").fast(2).s("supersaw").unison("<1 2 7>")
 *
 */
export const { unison } = registerControl('unison');

/**
 * Set the stereo pan spread for supported oscillators
 *
 * @name spread
 * @param {number | Pattern} spread between 0 and 1
 * @example
 * note("d f a a# a d3").fast(2).s("supersaw").spread("<0 .3 1>")
 *
 */
export const { spread } = registerControl('spread');
/**
 * Set dryness of reverb. See `room` and `size` for more information about reverb.
 *
 * @name dry
 * @param {number | Pattern} dry 0 = wet, 1 = dry
 * @example
 * n("[0,3,7](3,8)").s("superpiano").room(.7).dry("<0 .5 .75 1>").osc()
 * @superdirtOnly
 *
 */
export const { dry } = registerControl('dry');
// TODO: does not seem to do anything
/*
 * Used when using `begin`/`end` or `chop`/`striate` and friends, to change the fade out time of the 'grain' envelope.
 *
 * @name fadeTime
 * @param {number | Pattern} time between 0 and 1
 * @example
 * s("oh*4").end(.1).fadeTime("<0 .2 .4 .8>").osc()
 *
 */
export const { fadeTime, fadeOutTime } = registerControl('fadeTime', 'fadeOutTime');
// TODO: see above
export const { fadeInTime } = registerControl('fadeInTime');
/**
 * Set frequency of sound.
 *
 * @name freq
 * @param {number | Pattern} frequency in Hz. the audible range is between 20 and 20000 Hz
 * @example
 * freq("220 110 440 110").s("superzow").osc()
 * @example
 * freq("110".mul.out(".5 1.5 .6 [2 3]")).s("superzow").osc()
 *
 */
export const { freq } = registerControl('freq');
// pitch envelope
/**
 * Attack time of pitch envelope.
 *
 * @name pattack
 * @synonyms patt
 * @param {number | Pattern} time time in seconds
 * @example
 * note("c eb g bb").pattack("0 .1 .25 .5").slow(2)
 *
 */
export const { pattack, patt } = registerControl('pattack', 'patt');
/**
 * Decay time of pitch envelope.
 *
 * @name pdecay
 * @synonyms pdec
 * @param {number | Pattern} time time in seconds
 * @example
 * note("<c eb g bb>").pdecay("<0 .1 .25 .5>")
 *
 */
export const { pdecay, pdec } = registerControl('pdecay', 'pdec');
// TODO: how to use psustain?!
export const { psustain, psus } = registerControl('psustain', 'psus');
/**
 * Release time of pitch envelope
 *
 * @name prelease
 * @synonyms prel
 * @param {number | Pattern} time time in seconds
 * @example
 * note("<c eb g bb> ~")
 * .release(.5) // to hear the pitch release
 * .prelease("<0 .1 .25 .5>")
 *
 */
export const { prelease, prel } = registerControl('prelease', 'prel');
/**
 * Amount of pitch envelope. Negative values will flip the envelope.
 * If you don't set other pitch envelope controls, `pattack:.2` will be the default.
 *
 * @name penv
 * @param {number | Pattern} semitones change in semitones
 * @example
 * note("c")
 * .penv("<12 7 1 .5 0 -1 -7 -12>")
 *
 */
export const { penv } = registerControl('penv');
/**
 * Curve of envelope. Defaults to linear. exponential is good for kicks
 *
 * @name pcurve
 * @param {number | Pattern} type 0 = linear, 1 = exponential
 * @example
 * note("g1*4")
 * .s("sine").pdec(.5)
 * .penv(32)
 * .pcurve("<0 1>")
 *
 */
export const { pcurve } = registerControl('pcurve');
/**
 * Sets the range anchor of the envelope:
 * - anchor 0: range = [note, note + penv]
 * - anchor 1: range = [note - penv, note]
 * If you don't set an anchor, the value will default to the psustain value.
 *
 * @name panchor
 * @param {number | Pattern} anchor anchor offset
 * @example
 * note("c c4").penv(12).panchor("<0 .5 1 .5>")
 *
 */
export const { panchor } = registerControl('panchor');
// TODO: https://tidalcycles.org/docs/configuration/MIDIOSC/control-voltage/#gate
export const { gate, gat } = registerControl('gate', 'gat');
// ['hatgrain'],
// ['lagogo'],
// ['lclap'],
// ['lclaves'],
// ['lclhat'],
// ['lcrash'],
// TODO:
// https://tidalcycles.org/docs/reference/audio_effects/#leslie-1
// https://tidalcycles.org/docs/reference/audio_effects/#leslie
/**
 * Emulation of a Leslie speaker: speakers rotating in a wooden amplified cabinet.
 *
 * @name leslie
 * @param {number | Pattern} wet between 0 and 1
 * @example
 * n("0,4,7").s("supersquare").leslie("<0 .4 .6 1>").osc()
 * @superdirtOnly
 *
 */
export const { leslie } = registerControl('leslie');
/**
 * Rate of modulation / rotation for leslie effect
 *
 * @name lrate
 * @param {number | Pattern} rate 6.7 for fast, 0.7 for slow
 * @example
 * n("0,4,7").s("supersquare").leslie(1).lrate("<1 2 4 8>").osc()
 * @superdirtOnly
 *
 */
// TODO: the rate seems to "lag" (in the example, 1 will be fast)
export const { lrate } = registerControl('lrate');
/**
 * Physical size of the cabinet in meters. Be careful, it might be slightly larger than your computer. Affects the Doppler amount (pitch warble)
 *
 * @name lsize
 * @param {number | Pattern} meters somewhere between 0 and 1
 * @example
 * n("0,4,7").s("supersquare").leslie(1).lrate(2).lsize("<.1 .5 1>").osc()
 * @superdirtOnly
 *
 */
export const { lsize } = registerControl('lsize');
/**
 * Sets the displayed text for an event on the pianoroll
 *
 * @name label
 * @param {string} label text to display
 */
export const { activeLabel } = registerControl('activeLabel');
export const { label } = registerControl(['label', 'activeLabel']);
// ['lfo'],
// ['lfocutoffint'],
// ['lfodelay'],
// ['lfoint'],
// ['lfopitchint'],
// ['lfoshape'],
// ['lfosync'],
// ['lhitom'],
// ['lkick'],
// ['llotom'],
// ['lophat'],
// ['lsnare'],
// TODO: what is this? not found in tidal doc
export const { degree } = registerControl('degree');
// TODO: what is this? not found in tidal doc
export const { mtranspose } = registerControl('mtranspose');
// TODO: what is this? not found in tidal doc
export const { ctranspose } = registerControl('ctranspose');
// TODO: what is this? not found in tidal doc
export const { harmonic } = registerControl('harmonic');
// TODO: what is this? not found in tidal doc
export const { stepsPerOctave } = registerControl('stepsPerOctave');
// TODO: what is this? not found in tidal doc
export const { octaveR } = registerControl('octaveR');
// TODO: why is this needed? what's the difference to late / early? Answer: it's in seconds, and delays the message at
// OSC time (so can't be negative, at least not beyond the latency value)
export const { nudge } = registerControl('nudge');
// TODO: the following doc is just a guess, it's not documented in tidal doc.
/**
 * Sets the default octave of a synth.
 *
 * @name octave
 * @param {number | Pattern} octave octave number
 * @example
 * n("0,4,7").s('supersquare').octave("<3 4 5 6>").osc()
 * @superDirtOnly
 */
export const { octave } = registerControl('octave');

// ['ophatdecay'],
// TODO: example
/**
 * An `orbit` is a global parameter context for patterns. Patterns with the same orbit will share the same global effects.
 *
 * @name orbit
 * @param {number | Pattern} number
 * @example
 * stack(
 *   s("hh*6").delay(.5).delaytime(.25).orbit(1),
 *   s("~ sd ~ sd").delay(.5).delaytime(.125).orbit(2)
 * )
 */
export const { orbit } = registerControl('orbit');
// TODO: what is this? not found in tidal doc Answer: gain is limited to maximum of 2. This allows you to go over that
export const { overgain } = registerControl('overgain');
// TODO: what is this? not found in tidal doc. Similar to above, but limited to 1
export const { overshape } = registerControl('overshape');
/**
 * Sets position in stereo.
 *
 * @name pan
 * @param {number | Pattern} pan between 0 and 1, from left to right (assuming stereo), once round a circle (assuming multichannel)
 * @example
 * s("[bd hh]*2").pan("<.5 1 .5 0>")
 * @example
 * s("bd rim sd rim bd ~ cp rim").pan(sine.slow(2))
 *
 */
export const { pan } = registerControl('pan');
// TODO: this has no effect (see example)
/*
 * Controls how much multichannel output is fanned out
 *
 * @name panspan
 * @param {number | Pattern} span between -inf and inf, negative is backwards ordering
 * @example
 * s("[bd hh]*2").pan("<.5 1 .5 0>").panspan("<0 .5 1>").osc()
 *
 */
export const { panspan } = registerControl('panspan');
// TODO: this has no effect (see example)
/*
 * Controls how much multichannel output is spread
 *
 * @name pansplay
 * @param {number | Pattern} spread between 0 and 1
 * @example
 * s("[bd hh]*2").pan("<.5 1 .5 0>").pansplay("<0 .5 1>").osc()
 *
 */
export const { pansplay } = registerControl('pansplay');
export const { panwidth } = registerControl('panwidth');
export const { panorient } = registerControl('panorient');
// ['pitch1'],
// ['pitch2'],
// ['pitch3'],
// ['portamento'],
// TODO: LFO rate see https://tidalcycles.org/docs/patternlib/tutorials/synthesizers/#supersquare
export const { rate } = registerControl('rate');
// TODO: slide param for certain synths
export const { slide } = registerControl('slide');
// TODO: detune? https://tidalcycles.org/docs/patternlib/tutorials/synthesizers/#supersquare
export const { semitone } = registerControl('semitone');

// TODO: synth param
export const { voice } = registerControl('voice');
// voicings // https://github.com/tidalcycles/strudel/issues/506
// chord to voice, like C Eb Fm7 G7. the symbols can be defined via addVoicings
export const { chord } = registerControl('chord');
// which dictionary to use for the voicings
export const { dictionary, dict } = registerControl('dictionary', 'dict');
// the top note to align the voicing to, defaults to c5
export const { anchor } = registerControl('anchor');
// how the voicing is offset from the anchored position
export const { offset } = registerControl('offset');
// how many octaves are voicing steps spread apart, defaults to 1
export const { octaves } = registerControl('octaves');
// below = anchor note will be removed from the voicing, useful for melody harmonization
export const { mode } = registerControl(['mode', 'anchor']);

/**
 * Sets the level of reverb.
 *
 * When using mininotation, you can also optionally add the 'size' parameter, separated by ':'.
 *
 * @name room
 * @param {number | Pattern} level between 0 and 1
 * @example
 * s("bd sd [~ bd] sd").room("<0 .2 .4 .6 .8 1>")
 * @example
 * s("bd sd [~ bd] sd").room("<0.9:1 0.9:4>")
 *
 */
export const { room } = registerControl(['room', 'size']);
/**
 * Reverb lowpass starting frequency (in hertz).
 * When this property is changed, the reverb will be recaculated, so only change this sparsely..
 *
 * @name roomlp
 * @synonyms rlp
 * @param {number} frequency between 0 and 20000hz
 * @example
 * s("bd sd [~ bd] sd").room(0.5).rlp(10000)
 * @example
 * s("bd sd [~ bd] sd").room(0.5).rlp(5000)
 */
export const { roomlp, rlp } = registerControl('roomlp', 'rlp');
/**
 * Reverb lowpass frequency at -60dB (in hertz).
 * When this property is changed, the reverb will be recaculated, so only change this sparsely..
 *
 * @name roomdim
 * @synonyms rdim
 * @param {number} frequency between 0 and 20000hz
 * @example
 * s("bd sd [~ bd] sd").room(0.5).rlp(10000).rdim(8000)
 * @example
 * s("bd sd [~ bd] sd").room(0.5).rlp(5000).rdim(400)
 *
 */
export const { roomdim, rdim } = registerControl('roomdim', 'rdim');
/**
 * Reverb fade time (in seconds).
 * When this property is changed, the reverb will be recaculated, so only change this sparsely..
 *
 * @name roomfade
 * @synonyms rfade
 * @param {number} seconds for the reverb to fade
 * @example
 * s("bd sd [~ bd] sd").room(0.5).rlp(10000).rfade(0.5)
 * @example
 * s("bd sd [~ bd] sd").room(0.5).rlp(5000).rfade(4)
 *
 */
export const { roomfade, rfade } = registerControl('roomfade', 'rfade');
/**
 * Sets the sample to use as an impulse response for the reverb.
 * @name iresponse
 * @param {string | Pattern} sample to use as an impulse response
 * @synonyms ir
 * @example
 * s("bd sd [~ bd] sd").room(.8).ir("<shaker_large:0 shaker_large:2>")
 *
 */
export const { ir, iresponse } = registerControl(['ir', 'i'], 'iresponse');
/**
 * Sets the room size of the reverb, see `room`.
 * When this property is changed, the reverb will be recaculated, so only change this sparsely..
 *
 * @name roomsize
 * @param {number | Pattern} size between 0 and 10
 * @synonyms rsize, sz, size
 * @example
 * s("bd sd [~ bd] sd").room(.8).rsize(1)
 * @example
 * s("bd sd [~ bd] sd").room(.8).rsize(4)
 *
 */
// TODO: find out why :
// s("bd sd [~ bd] sd").room(.8).roomsize("<0 .2 .4 .6 .8 [1,0]>").osc()
// .. does not work. Is it because room is only one effect?
export const { roomsize, size, sz, rsize } = registerControl('roomsize', 'size', 'sz', 'rsize');
// ['sagogo'],
// ['sclap'],
// ['sclaves'],
// ['scrash'],
/**
 * (Deprecated) Wave shaping distortion. WARNING: can suddenly get unpredictably loud.
 * Please use distort instead, which has a more predictable response curve
 * second option in optional array syntax (ex: ".9:.5") applies a postgain to the output
 *
 *
 * @name shape
 * @param {number | Pattern} distortion between 0 and 1
 * @example
 * s("bd sd [~ bd] sd,hh*8").shape("<0 .2 .4 .6 .8>")
 *
 */
export const { shape } = registerControl(['shape', 'shapevol']);
/**
 * Wave shaping distortion. CAUTION: it can get loud.
 * Second option in optional array syntax (ex: ".9:.5") applies a postgain to the output.
 * Most useful values are usually between 0 and 10 (depending on source gain). If you are feeling adventurous, you can turn it up to 11 and beyond ;)
 *
 * @name distort
 * @synonyms dist
 * @param {number | Pattern} distortion
 * @example
 * s("bd sd [~ bd] sd,hh*8").distort("<0 2 3 10:.5>")
 * @example
 * note("d1!8").s("sine").penv(36).pdecay(.12).decay(.23).distort("8:.4")
 *
 */
export const { distort, dist } = registerControl(['distort', 'distortvol'], 'dist');
/**
 * Dynamics Compressor. The params are `compressor("threshold:ratio:knee:attack:release")`
 * More info [here](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode?retiredLocale=de#instance_properties)
 *
 * @name compressor
 * @example
 * s("bd sd [~ bd] sd,hh*8")
 * .compressor("-20:20:10:.002:.02")
 *
 */
export const { compressor } = registerControl([
  'compressor',
  'compressorRatio',
  'compressorKnee',
  'compressorAttack',
  'compressorRelease',
]);
export const { compressorKnee } = registerControl('compressorKnee');
export const { compressorRatio } = registerControl('compressorRatio');
export const { compressorAttack } = registerControl('compressorAttack');
export const { compressorRelease } = registerControl('compressorRelease');
/**
 * Changes the speed of sample playback, i.e. a cheap way of changing pitch.
 *
 * @name speed
 * @param {number | Pattern} speed -inf to inf, negative numbers play the sample backwards.
 * @example
 * s("bd*6").speed("1 2 4 1 -2 -4")
 * @example
 * speed("1 1.5*2 [2 1.1]").s("piano").clip(1)
 *
 */
export const { speed } = registerControl('speed');

/**
 * Changes the speed of sample playback, i.e. a cheap way of changing pitch.
 *
 * @name stretch
 * @param {number | Pattern} factor -inf to inf, negative numbers play the sample backwards.
 * @example
 * s("gm_flute").stretch("1 2 .5")
 *
 */
export const { stretch } = registerControl('stretch');
/**
 * Used in conjunction with `speed`, accepts values of "r" (rate, default behavior), "c" (cycles), or "s" (seconds). Using `unit "c"` means `speed` will be interpreted in units of cycles, e.g. `speed "1"` means samples will be stretched to fill a cycle. Using `unit "s"` means the playback speed will be adjusted so that the duration is the number of seconds specified by `speed`.
 *
 * @name unit
 * @param {number | string | Pattern} unit see description above
 * @example
 * speed("1 2 .5 3").s("bd").unit("c").osc()
 * @superdirtOnly
 *
 */

export const { unit } = registerControl('unit');
/**
 * Made by Calum Gunn. Reminiscent of some weird mixture of filter, ring-modulator and pitch-shifter. The SuperCollider manual defines Squiz as:
 *
 * "A simplistic pitch-raising algorithm. It's not meant to sound natural; its sound is reminiscent of some weird mixture of filter, ring-modulator and pitch-shifter, depending on the input. The algorithm works by cutting the signal into fragments (delimited by upwards-going zero-crossings) and squeezing those fragments in the time domain (i.e. simply playing them back faster than they came in), leaving silences inbetween. All the parameters apart from memlen can be modulated."
 *
 * @name squiz
 * @param {number | Pattern} squiz Try passing multiples of 2 to it - 2, 4, 8 etc.
 * @example
 * squiz("2 4/2 6 [8 16]").s("bd").osc()
 * @superdirtOnly
 *
 */
export const { squiz } = registerControl('squiz');
// TODO: what is this? not found in tidal doc
// ['stutterdepth'],
// TODO: what is this? not found in tidal doc
// ['stuttertime'],
// TODO: what is this? not found in tidal doc
// ['timescale'],
// TODO: what is this? not found in tidal doc
// ['timescalewin'],
// ['tomdecay'],
// ['vcfegint'],
// ['vcoegint'],
// TODO: Use a rest (~) to override the effect <- vowel
/**
 *
 * Formant filter to make things sound like vowels.
 *
 * @name vowel
 * @param {string | Pattern} vowel You can use a e i o u ae aa oe ue y uh un en an on, corresponding to [a] [e] [i] [o] [u] [æ] [ɑ] [ø] [y] [ɯ] [ʌ] [œ̃] [ɛ̃] [ɑ̃] [ɔ̃]. Aliases: aa = å = ɑ, oe = ø = ö, y = ı, ae = æ.
 * @example
 * note("[c2 <eb2 <g2 g1>>]*2").s('sawtooth')
 * .vowel("<a e i <o u>>")
 * @example
 * s("bd sd mt ht bd [~ cp] ht lt").vowel("[a|e|i|o|u]")
 *
 */
export const { vowel } = registerControl('vowel');
/* // TODO: find out how it works
 * Made by Calum Gunn. Divides an audio stream into tiny segments, using the signal's zero-crossings as segment boundaries, and discards a fraction of them. Takes a number between 1 and 100, denoted the percentage of segments to drop. The SuperCollider manual describes the Waveloss effect this way:
 *
 * Divide an audio stream into tiny segments, using the signal's zero-crossings as segment boundaries, and discard a fraction of them (i.e. replace them with silence of the same length). The technique was described by Trevor Wishart in a lecture. Parameters: the filter drops drop out of out of chunks. mode can be 1 to drop chunks in a simple deterministic fashion (e.g. always dropping the first 30 out of a set of 40 segments), or 2 to drop chunks randomly but in an appropriate proportion.)
 *
 * mode: ?
 * waveloss: ?
 *
 * @name waveloss
 */
export const { waveloss } = registerControl('waveloss');
/*
 * Noise crackle density
 *
 * @name density
 * @param {number | Pattern} density between 0 and x
 * @example
 * s("crackle*4").density("<0.01 0.04 0.2 0.5>".slow(4))
 *
 */
export const { density } = registerControl('density');
// ['modwheel'],
export const { expression } = registerControl('expression');
export const { sustainpedal } = registerControl('sustainpedal');
/* // TODO: doesn't seem to do anything
 *
 * Tremolo Audio DSP effect
 *
 * @name tremolodepth
 * @param {number | Pattern} depth between 0 and 1
 * @example
 * n("0,4,7").tremolodepth("<0 .3 .6 .9>").osc()
 *
 */
export const { tremolodepth, tremdp } = registerControl('tremolodepth', 'tremdp');
export const { tremolorate, tremr } = registerControl('tremolorate', 'tremr');

export const { fshift } = registerControl('fshift');
export const { fshiftnote } = registerControl('fshiftnote');
export const { fshiftphase } = registerControl('fshiftphase');

export const { triode } = registerControl('triode');
export const { krush } = registerControl('krush');
export const { kcutoff } = registerControl('kcutoff');
export const { octer } = registerControl('octer');
export const { octersub } = registerControl('octersub');
export const { octersubsub } = registerControl('octersubsub');
export const { ring } = registerControl('ring');
export const { ringf } = registerControl('ringf');
export const { ringdf } = registerControl('ringdf');
export const { freeze } = registerControl('freeze');
export const { xsdelay } = registerControl('xsdelay');
export const { tsdelay } = registerControl('tsdelay');
export const { real } = registerControl('real');
export const { imag } = registerControl('imag');
export const { enhance } = registerControl('enhance');
export const { partials } = registerControl('partials');
export const { comb } = registerControl('comb');
export const { smear } = registerControl('smear');
export const { scram } = registerControl('scram');
export const { binshift } = registerControl('binshift');
export const { hbrick } = registerControl('hbrick');
export const { lbrick } = registerControl('lbrick');

export const { frameRate } = registerControl('frameRate');
export const { frames } = registerControl('frames');
export const { hours } = registerControl('hours');
export const { minutes } = registerControl('minutes');
export const { seconds } = registerControl('seconds');
export const { songPtr } = registerControl('songPtr');
export const { uid } = registerControl('uid');
export const { val } = registerControl('val');
export const { cps } = registerControl('cps');
/**
 * Multiplies the duration with the given number. Also cuts samples off at the end if they exceed the duration.
 *
 * @name clip
 * @synonyms legato
 * @param {number | Pattern} factor >= 0
 * @example
 * note("c a f e").s("piano").clip("<.5 1 2>")
 *
 */
export const { clip, legato } = registerControl('clip', 'legato');

/**
 * Sets the duration of the event in cycles. Similar to clip / legato, it also cuts samples off at the end if they exceed the duration.
 *
 * @name duration
 * @synonyms dur
 * @param {number | Pattern} seconds >= 0
 * @example
 * note("c a f e").s("piano").dur("<.5 1 2>")
 *
 */
export const { duration, dur } = registerControl('duration', 'dur');

// ZZFX
export const { zrand } = registerControl('zrand');
export const { curve } = registerControl('curve');
// superdirt duplicate
// export const {slide]} = registerControl('slide']);
export const { deltaSlide } = registerControl('deltaSlide');
export const { pitchJump } = registerControl('pitchJump');
export const { pitchJumpTime } = registerControl('pitchJumpTime');
export const { lfo, repeatTime } = registerControl('lfo', 'repeatTime');
// noise on the frequency or as bubo calls it "frequency fog" :)
export const { znoise } = registerControl('znoise');
export const { zmod } = registerControl('zmod');
// like crush but scaled differently
export const { zcrush } = registerControl('zcrush');
export const { zdelay } = registerControl('zdelay');
export const { tremolo } = registerControl('tremolo');
export const { zzfx } = registerControl('zzfx');

/**
 * Sets the color of the hap in visualizations like pianoroll or highlighting.
 * @name color
 * @synonyms colour
 * @param {string} color Hexadecimal or CSS color name
 */
export const { color, colour } = registerControl(['color', 'colour']);

// TODO: slice / splice https://www.youtube.com/watch?v=hKhPdO0RKDQ&list=PL2lW1zNIIwj3bDkh-Y3LUGDuRcoUigoDs&index=13

export let createParams = (...names) =>
  names.reduce((acc, name) => Object.assign(acc, { [name]: createParam(name) }), {});

/**
 * ADSR envelope: Combination of Attack, Decay, Sustain, and Release.
 *
 * @name adsr
 * @param {number | Pattern} time attack time in seconds
 * @param {number | Pattern} time decay time in seconds
 * @param {number | Pattern} gain sustain level (0 to 1)
 * @param {number | Pattern} time release time in seconds
 * @example
 * note("[c3 bb2 f3 eb3]*2").sound("sawtooth").lpf(600).adsr(".1:.1:.5:.2")
 */
export const adsr = register('adsr', (adsr, pat) => {
  adsr = !Array.isArray(adsr) ? [adsr] : adsr;
  const [attack, decay, sustain, release] = adsr;
  return pat.set({ attack, decay, sustain, release });
});
export const ad = register('ad', (t, pat) => {
  t = !Array.isArray(t) ? [t] : t;
  const [attack, decay = attack] = t;
  return pat.attack(attack).decay(decay);
});
export const ds = register('ds', (t, pat) => {
  t = !Array.isArray(t) ? [t] : t;
  const [decay, sustain = 0] = t;
  return pat.set({ decay, sustain });
});
export const ar = register('ar', (t, pat) => {
  t = !Array.isArray(t) ? [t] : t;
  const [attack, release = attack] = t;
  return pat.set({ attack, release });
});

//MIDI

/**
 * MIDI channel: Sets the MIDI channel for the event.
 *
 * @name midichan
 * @param {number | Pattern} channel MIDI channel number (0-15)
 * @example
 * note("c4").midichan(1).midi()
 */
export const { midichan } = registerControl('midichan');

export const { midimap } = registerControl('midimap');

/**
 * MIDI port: Sets the MIDI port for the event.
 *
 * @name midiport
 * @param {number | Pattern} port MIDI port
 * @example
 * note("c a f e").midiport("<0 1 2 3>").midi()
 */
export const { midiport } = registerControl('midiport');

/**
 * MIDI command: Sends a MIDI command message.
 *
 * @name midicmd
 * @param {number | Pattern} command MIDI command
 * @example
 * midicmd("clock*48,<start stop>/2").midi()
 */
export const { midicmd } = registerControl('midicmd');

/**
 * MIDI control: Sends a MIDI control change message.
 *
 * @name control
 * @param {number | Pattern}  MIDI control number (0-127)
 * @param {number | Pattern}  MIDI controller value (0-127)
 */
export const control = register('control', (args, pat) => {
  if (!Array.isArray(args)) {
    throw new Error('control expects an array of [ccn, ccv]');
  }
  const [_ccn, _ccv] = args;
  return pat.ccn(_ccn).ccv(_ccv);
});

/**
 * MIDI control number: Sends a MIDI control change message.
 *
 * @name ccn
 * @param {number | Pattern}  MIDI control number (0-127)
 */
export const { ccn } = registerControl('ccn');
/**
 * MIDI control value: Sends a MIDI control change message.
 *
 * @name ccv
 * @param {number | Pattern}  MIDI control value (0-127)
 */
export const { ccv } = registerControl('ccv');
export const { ctlNum } = registerControl('ctlNum');
// TODO: ctlVal?

/**
 * MIDI NRPN non-registered parameter number: Sends a MIDI NRPN non-registered parameter number message.
 * @name nrpnn
 * @param {number | Pattern} nrpnn MIDI NRPN non-registered parameter number (0-127)
 * @example
 * note("c4").nrpnn("1:8").nrpv("123").midichan(1).midi()
 */
export const { nrpnn } = registerControl('nrpnn');
/**
 * MIDI NRPN non-registered parameter value: Sends a MIDI NRPN non-registered parameter value message.
 * @name nrpv
 * @param {number | Pattern} nrpv MIDI NRPN non-registered parameter value (0-127)
 * @example
 * note("c4").nrpnn("1:8").nrpv("123").midichan(1).midi()
 */
export const { nrpv } = registerControl('nrpv');

/**
 * MIDI program number: Sends a MIDI program change message.
 *
 * @name progNum
 * @param {number | Pattern} program MIDI program number (0-127)
 * @example
 * note("c4").progNum(10).midichan(1).midi()
 */
export const { progNum } = registerControl('progNum');

/**
 * MIDI sysex: Sends a MIDI sysex message.
 * @name sysex
 * @param {number | Pattern} id Sysex ID
 * @param {number | Pattern} data Sysex data
 * @example
 * note("c4").sysex(["0x77", "0x01:0x02:0x03:0x04"]).midichan(1).midi()
 */
export const sysex = register('sysex', (args, pat) => {
  if (!Array.isArray(args)) {
    throw new Error('sysex expects an array of [id, data]');
  }
  const [id, data] = args;
  return pat.sysexid(id).sysexdata(data);
});
/**
 * MIDI sysex ID: Sends a MIDI sysex identifier message.
 * @name sysexid
 * @param {number | Pattern} id Sysex ID
 * @example
 * note("c4").sysexid("0x77").sysexdata("0x01:0x02:0x03:0x04").midichan(1).midi()
 */
export const { sysexid } = registerControl('sysexid');
/**
 * MIDI sysex data: Sends a MIDI sysex message.
 * @name sysexdata
 * @param {number | Pattern} data Sysex data
 * @example
 * note("c4").sysexid("0x77").sysexdata("0x01:0x02:0x03:0x04").midichan(1).midi()
 */
export const { sysexdata } = registerControl('sysexdata');

/**
 * MIDI pitch bend: Sends a MIDI pitch bend message.
 * @name midibend
 * @param {number | Pattern} midibend MIDI pitch bend (-1 - 1)
 * @example
 * note("c4").midibend(sine.slow(4).range(-0.4,0.4)).midi()
 */
export const { midibend } = registerControl('midibend');
/**
 * MIDI key after touch: Sends a MIDI key after touch message.
 * @name miditouch
 * @param {number | Pattern} miditouch MIDI key after touch (0-1)
 * @example
 * note("c4").miditouch(sine.slow(4).range(0,1)).midi()
 */
export const { miditouch } = registerControl('miditouch');

// TODO: what is this?
export const { polyTouch } = registerControl('polyTouch');

export const getControlName = (alias) => {
  if (controlAlias.has(alias)) {
    return controlAlias.get(alias);
  }
  return alias;
};

/**
 * Sets properties in a batch.
 *
 * @name as
 * @param {String | Array} mapping the control names that are set
 * @example
 * "c:.5 a:1 f:.25 e:.8".as("note:clip")
 * @example
 * "{0@2 0.25 0 0.5 .3 .5}%8".as("begin").s("sax_vib").clip(1)
 */
export const as = register('as', (mapping, pat) => {
  mapping = Array.isArray(mapping) ? mapping : [mapping];
  return pat.fmap((v) => {
    v = Array.isArray(v) ? v : [v];
    v = Object.fromEntries(mapping.map((prop, i) => [getControlName(prop), v[i]]));
    return v;
  });
});
