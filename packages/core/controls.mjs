/*
controls.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/controls.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, register, sequence } from './pattern.mjs';
import { zipWith } from './util.mjs';

const controls = {};
const generic_params = [
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
  [['s', 'n', 'gain'], 'sound'],
  /**
   * Define a custom webaudio node to use as a sound source.
   *
   * @name source
   * @param {function} getSource
   * @synonyms src
   *
   */
  ['source', 'src'],
  /**
   * Selects the given index from the sample map.
   * Numbers too high will wrap around.
   * `n` can also be used to play midi numbers, but it is recommended to use `note` instead.
   *
   * @name n
   * @param {number | Pattern} value sample index starting from 0
   * @example
   * s("bd sd,hh*3").n("<0 1>")
   */
  // also see https://github.com/tidalcycles/strudel/pull/63
  ['n'],
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
  [['note', 'n']],

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
  ['accelerate'],
  /**
   * Controls the gain by an exponential amount.
   *
   * @name gain
   * @param {number | Pattern} amount gain.
   * @example
   * s("hh*8").gain(".4!2 1 .4!2 1 .4 1")
   *
   */
  ['gain'],
  /**
   * Like {@link gain}, but linear.
   *
   * @name amp
   * @param {number | Pattern} amount gain.
   * @superdirtOnly
   * @example
   * s("bd*8").amp(".1*2 .5 .1*2 .5 .1 .5").osc()
   *
   */
  ['amp'],
  /**
   * Amplitude envelope attack time: Specifies how long it takes for the sound to reach its peak value, relative to the onset.
   *
   * @name attack
   * @param {number | Pattern} attack time in seconds.
   * @synonyms att
   * @example
   * note("c3 e3").attack("<0 .1 .5>")
   *
   */
  ['attack', 'att'],

  /**
   * Select the sound bank to use. To be used together with `s`. The bank name (+ "_") will be prepended to the value of `s`.
   *
   * @name bank
   * @param {string | Pattern} bank the name of the bank
   * @example
   * s("bd sd").bank('RolandTR909') // = s("RolandTR909_bd RolandTR909_sd")
   *
   */
  ['bank'],

  /**
   * Amplitude envelope decay time: the time it takes after the attack time to reach the sustain level.
   * Note that the decay is only audible if the sustain value is lower than 1.
   *
   * @name decay
   * @param {number | Pattern} time decay time in seconds
   * @example
   * note("c3 e3").decay("<.1 .2 .3 .4>").sustain(0)
   *
   */
  ['decay'],
  /**
   * Amplitude envelope sustain level: The level which is reached after attack / decay, being sustained until the offset.
   *
   * @name sustain
   * @param {number | Pattern} gain sustain level between 0 and 1
   * @synonyms sus
   * @example
   * note("c3 e3").decay(.2).sustain("<0 .1 .4 .6 1>")
   *
   */
  ['sustain', 'sus'],
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
  ['release', 'rel'],
  ['hold'],
  // TODO: in tidal, it seems to be normalized
  /**
   * Sets the center frequency of the **b**and-**p**ass **f**ilter. When using mininotation, you
   * can also optionally supply the 'bpq' parameter separated by ':'.
   *
   * @name bpf
   * @param {number | Pattern} frequency center frequency
   * @synonyms bandf, bp
   * @example
   * s("bd sd,hh*3").bpf("<1000 2000 4000 8000>")
   *
   */
  [['bandf', 'bandq'], 'bpf', 'bp'],
  // TODO: in tidal, it seems to be normalized
  /**
   * Sets the **b**and-**p**ass **q**-factor (resonance).
   *
   * @name bpq
   * @param {number | Pattern} q q factor
   * @synonyms bandq
   * @example
   * s("bd sd").bpf(500).bpq("<0 1 2 3>")
   *
   */
  // currently an alias of 'bandq' https://github.com/tidalcycles/strudel/issues/496
  // ['bpq'],
  ['bandq', 'bpq'],
  /**
   * a pattern of numbers from 0 to 1. Skips the beginning of each sample, e.g. `0.25` to cut off the first quarter from each sample.
   *
   * @memberof Pattern
   * @name begin
   * @param {number | Pattern} amount between 0 and 1, where 1 is the length of the sample
   * @example
   * samples({ rave: 'rave/AREUREADY.wav' }, 'github:tidalcycles/Dirt-Samples/master/')
   * s("rave").begin("<0 .25 .5 .75>")
   *
   */
  ['begin'],
  /**
   * The same as .begin, but cuts off the end off each sample.
   *
   * @memberof Pattern
   * @name end
   * @param {number | Pattern} length 1 = whole sample, .5 = half sample, .25 = quarter sample etc..
   * @example
   * s("bd*2,oh*4").end("<.1 .2 .5 1>")
   *
   */
  ['end'],
  /**
   * Loops the sample (from `begin` to `end`) the specified number of times.
   * Note that the tempo of the loop is not synced with the cycle tempo.
   *
   * @name loop
   * @param {number | Pattern} times How often the sample is looped
   * @example
   * s("bd").loop("<1 2 3 4>").osc()
   *
   */
  ['loop'],
  // TODO: currently duplicated with "native" legato
  // TODO: superdirt legato will do more: https://youtu.be/dQPmE1WaD1k?t=419
  /**
   * a pattern of numbers from 0 to 1. Skips the beginning of each sample, e.g. `0.25` to cut off the first quarter from each sample.
   *
   * @name legato
   * @param {number | Pattern} duration between 0 and 1, where 1 is the length of the whole hap time
   * @example
   * "c4 eb4 g4 bb4".legato("<0.125 .25 .5 .75 1 2 4>")
   *
   */
  // ['legato'],
  // ['clhatdecay'],
  /**
   * bit crusher effect.
   *
   * @name crush
   * @param {number | Pattern} depth between 1 (for drastic reduction in bit-depth) to 16 (for barely no reduction).
   * @example
   * s("<bd sd>,hh*3").fast(2).crush("<16 8 7 6 5 4 3 2>")
   *
   */
  ['crush'],
  /**
   * fake-resampling for lowering the sample rate. Caution: This effect seems to only work in chromium based browsers
   *
   * @name coarse
   * @param {number | Pattern} factor 1 for original 2 for half, 3 for a third and so on.
   * @example
   * s("bd sd,hh*4").coarse("<1 4 8 16 32>")
   *
   */
  ['coarse'],

  /**
   * choose the channel the pattern is sent to in superdirt
   *
   * @name channel
   * @param {number | Pattern} channel channel number
   *
   */
  ['channel'],
  /**
   * In the style of classic drum-machines, `cut` will stop a playing sample as soon as another samples with in same cutgroup is to be played. An example would be an open hi-hat followed by a closed one, essentially muting the open.
   *
   * @name cut
   * @param {number | Pattern} group cut group number
   * @example
   * s("rd*4").cut(1)
   *
   */
  ['cut'],
  /**
   * Applies the cutoff frequency of the **l**ow-**p**ass **f**ilter.
   *
   * When using mininotation, you can also optionally add the 'lpq' parameter, separated by ':'.
   *
   * @name lpf
   * @param {number | Pattern} frequency audible between 0 and 20000
   * @synonyms cutoff, ctf, lp
   * @example
   * s("bd sd,hh*3").lpf("<4000 2000 1000 500 200 100>")
   * @example
   * s("bd*8").lpf("1000:0 1000:10 1000:20 1000:30")
   *
   */
  [['cutoff', 'resonance'], 'ctf', 'lpf', 'lp'],
  /**
   * Applies the cutoff frequency of the **h**igh-**p**ass **f**ilter.
   *
   * When using mininotation, you can also optionally add the 'hpq' parameter, separated by ':'.
   *
   * @name hpf
   * @param {number | Pattern} frequency audible between 0 and 20000
   * @synonyms hp, hcutoff
   * @example
   * s("bd sd,hh*4").hpf("<4000 2000 1000 500 200 100>")
   * @example
   * s("bd sd,hh*4").hpf("<2000 2000:25>")
   *
   */
  // currently an alias of 'hcutoff' https://github.com/tidalcycles/strudel/issues/496
  // ['hpf'],
  [['hcutoff', 'hresonance'], 'hpf', 'hp'],
  /**
   * Controls the **h**igh-**p**ass **q**-value.
   *
   * @name hpq
   * @param {number | Pattern} q resonance factor between 0 and 50
   * @synonyms hresonance
   * @example
   * s("bd sd,hh*4").hpf(2000).hpq("<0 10 20 30>")
   *
   */
  ['hresonance', 'hpq'],
  /**
   * Controls the **l**ow-**p**ass **q**-value.
   *
   * @name lpq
   * @param {number | Pattern} q resonance factor between 0 and 50
   * @synonyms resonance
   * @example
   * s("bd sd,hh*4").lpf(2000).lpq("<0 10 20 30>")
   *
   */
  // currently an alias of 'resonance' https://github.com/tidalcycles/strudel/issues/496
  ['resonance', 'lpq'],
  /**
   * DJ filter, below 0.5 is low pass filter, above is high pass filter.
   *
   * @name djf
   * @param {number | Pattern} cutoff below 0.5 is low pass filter, above is high pass filter
   * @example
   * n("0 3 7 [10,24]").s('superzow').octave(3).djf("<.5 .25 .5 .75>").osc()
   *
   */
  ['djf'],
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
   * s("bd").delay("<0 .25 .5 1>")
   * @example
   * s("bd bd").delay("0.65:0.25:0.9 0.65:0.125:0.7")
   *
   */
  [['delay', 'delaytime', 'delayfeedback']],
  /**
   * Sets the level of the signal that is fed back into the delay.
   * Caution: Values >= 1 will result in a signal that gets louder and louder! Don't do it
   *
   * @name delayfeedback
   * @param {number | Pattern} feedback between 0 and 1
   * @synonyms delayfb, dfb
   * @example
   * s("bd").delay(.25).delayfeedback("<.25 .5 .75 1>").slow(2)
   *
   */
  ['delayfeedback', 'delayfb', 'dfb'],
  /**
   * Sets the time of the delay effect.
   *
   * @name delaytime
   * @param {number | Pattern} seconds between 0 and Infinity
   * @synonyms delayt, dt
   * @example
   * s("bd").delay(.25).delaytime("<.125 .25 .5 1>").slow(2)
   *
   */
  ['delaytime', 'delayt', 'dt'],
  /* // TODO: test
   * Specifies whether delaytime is calculated relative to cps.
   *
   * @name lock
   * @param {number | Pattern} enable When set to 1, delaytime is a direct multiple of a cycle.
   * @example
   * s("sd").delay().lock(1).osc()
   *
   */
  ['lock'],
  /**
   * Set detune of oscillators. Works only with some synths, see <a target="_blank" href="https://tidalcycles.org/docs/patternlib/tutorials/synthesizers">tidal doc</a>
   *
   * @name detune
   * @param {number | Pattern} amount between 0 and 1
   * @synonyms det
   * @superdirtOnly
   * @example
   * n("0 3 7").s('superzow').octave(3).detune("<0 .25 .5 1 2>").osc()
   *
   */
  ['detune', 'det'],
  /**
   * Set dryness of reverb. See {@link room} and {@link size} for more information about reverb.
   *
   * @name dry
   * @param {number | Pattern} dry 0 = wet, 1 = dry
   * @example
   * n("[0,3,7](3,8)").s("superpiano").room(.7).dry("<0 .5 .75 1>").osc()
   * @superdirtOnly
   *
   */
  ['dry'],
  // TODO: does not seem to do anything
  /*
   * Used when using {@link begin}/{@link end} or {@link chop}/{@link striate} and friends, to change the fade out time of the 'grain' envelope.
   *
   * @name fadeTime
   * @param {number | Pattern} time between 0 and 1
   * @example
   * s("oh*4").end(.1).fadeTime("<0 .2 .4 .8>").osc()
   *
   */
  ['fadeTime', 'fadeOutTime'],
  // TODO: see above
  ['fadeInTime'],
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
  ['freq'],
  // TODO: https://tidalcycles.org/docs/configuration/MIDIOSC/control-voltage/#gate
  ['gate', 'gat'],
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
  ['leslie'],
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
  ['lrate'],
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
  ['lsize'],
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
  ['degree'], // TODO: what is this? not found in tidal doc
  ['mtranspose'], // TODO: what is this? not found in tidal doc
  ['ctranspose'], // TODO: what is this? not found in tidal doc
  ['harmonic'], // TODO: what is this? not found in tidal doc
  ['stepsPerOctave'], // TODO: what is this? not found in tidal doc
  ['octaveR'], // TODO: what is this? not found in tidal doc
  // TODO: why is this needed? what's the difference to late / early? Answer: it's in seconds, and delays the message at
  // OSC time (so can't be negative, at least not beyond the latency value)
  ['nudge'],
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
  ['octave'],
  ['offset'], // TODO: what is this? not found in tidal doc
  // ['ophatdecay'],
  // TODO: example
  /**
   * An `orbit` is a global parameter context for patterns. Patterns with the same orbit will share the same global effects.
   *
   * @name orbit
   * @param {number | Pattern} number
   * @example
   * stack(
   *   s("hh*3").delay(.5).delaytime(.25).orbit(1),
   *   s("~ sd").delay(.5).delaytime(.125).orbit(2)
   * )
   */
  ['orbit'],
  ['overgain'], // TODO: what is this? not found in tidal doc Answer: gain is limited to maximum of 2. This allows you to go over that
  ['overshape'], // TODO: what is this? not found in tidal doc. Similar to above, but limited to 1
  /**
   * Sets position in stereo.
   *
   * @name pan
   * @param {number | Pattern} pan between 0 and 1, from left to right (assuming stereo), once round a circle (assuming multichannel)
   * @example
   * s("[bd hh]*2").pan("<.5 1 .5 0>")
   *
   */
  ['pan'],
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
  ['panspan'],
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
  ['pansplay'],
  ['panwidth'],
  ['panorient'],
  // ['pitch1'],
  // ['pitch2'],
  // ['pitch3'],
  // ['portamento'],
  // TODO: LFO rate see https://tidalcycles.org/docs/patternlib/tutorials/synthesizers/#supersquare
  ['rate'],
  // TODO: slide param for certain synths
  ['slide'],
  // TODO: detune? https://tidalcycles.org/docs/patternlib/tutorials/synthesizers/#supersquare
  ['semitone'],
  // TODO: dedup with synth param, see https://tidalcycles.org/docs/reference/synthesizers/#superpiano
  // ['velocity'],
  ['voice'], // TODO: synth param
  /**
   * Sets the level of reverb.
   *
   * When using mininotation, you can also optionally add the 'size' parameter, separated by ':'.
   *
   * @name room
   * @param {number | Pattern} level between 0 and 1
   * @example
   * s("bd sd").room("<0 .2 .4 .6 .8 1>")
   * @example
   * s("bd sd").room("<0.9:1 0.9:4>")
   *
   */
  [['room', 'size']],
  /**
   * Sets the room size of the reverb, see {@link room}.
   *
   * @name roomsize
   * @param {number | Pattern} size between 0 and 10
   * @synonyms size, sz
   * @example
   * s("bd sd").room(.8).roomsize("<0 1 2 4 8>")
   *
   */
  // TODO: find out why :
  // s("bd sd").room(.8).roomsize("<0 .2 .4 .6 .8 [1,0]>").osc()
  // .. does not work. Is it because room is only one effect?
  ['size', 'sz', 'roomsize'],
  // ['sagogo'],
  // ['sclap'],
  // ['sclaves'],
  // ['scrash'],
  /**
   * Wave shaping distortion. CAUTION: it might get loud
   *
   * @name shape
   * @param {number | Pattern} distortion between 0 and 1
   * @example
   * s("bd sd,hh*4").shape("<0 .2 .4 .6 .8>")
   *
   */
  ['shape'],
  /**
   * Changes the speed of sample playback, i.e. a cheap way of changing pitch.
   *
   * @name speed
   * @param {number | Pattern} speed -inf to inf, negative numbers play the sample backwards.
   * @example
   * s("bd").speed("<1 2 4 1 -2 -4>")
   * @example
   * speed("1 1.5*2 [2 1.1]").s("piano").clip(1)
   *
   */
  ['speed'],
  /**
   * Used in conjunction with {@link speed}, accepts values of "r" (rate, default behavior), "c" (cycles), or "s" (seconds). Using `unit "c"` means `speed` will be interpreted in units of cycles, e.g. `speed "1"` means samples will be stretched to fill a cycle. Using `unit "s"` means the playback speed will be adjusted so that the duration is the number of seconds specified by `speed`.
   *
   * @name unit
   * @param {number | string | Pattern} unit see description above
   * @example
   * speed("1 2 .5 3").s("bd").unit("c").osc()
   * @superdirtOnly
   *
   */
  ['unit'],
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
  ['squiz'],
  // ['stutterdepth'], // TODO: what is this? not found in tidal doc
  // ['stuttertime'], // TODO: what is this? not found in tidal doc
  // ['timescale'], // TODO: what is this? not found in tidal doc
  // ['timescalewin'], // TODO: what is this? not found in tidal doc
  // ['tomdecay'],
  // ['vcfegint'],
  // ['vcoegint'],
  // TODO: Use a rest (~) to override the effect <- vowel
  /**
   *
   * Formant filter to make things sound like vowels.
   *
   * @name vowel
   * @param {string | Pattern} vowel You can use a e i o u.
   * @example
   * note("c2 <eb2 <g2 g1>>").s('sawtooth')
   * .vowel("<a e i <o u>>")
   *
   */
  ['vowel'],
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
  ['waveloss'],
  // TODO: midi effects?
  ['dur'],
  // ['modwheel'],
  ['expression'],
  ['sustainpedal'],
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
  ['tremolodepth', 'tremdp'],
  ['tremolorate', 'tremr'],
  // TODO: doesn't seem to do anything
  ['phaserdepth', 'phasdp'],
  ['phaserrate', 'phasr'],

  ['fshift'],
  ['fshiftnote'],
  ['fshiftphase'],

  ['triode'],
  ['krush'],
  ['kcutoff'],
  ['octer'],
  ['octersub'],
  ['octersubsub'],
  ['ring'],
  ['ringf'],
  ['ringdf'],
  ['distort'],
  ['freeze'],
  ['xsdelay'],
  ['tsdelay'],
  ['real'],
  ['imag'],
  ['enhance'],
  ['partials'],
  ['comb'],
  ['smear'],
  ['scram'],
  ['binshift'],
  ['hbrick'],
  ['lbrick'],
  ['midichan'],
  ['control'],
  ['ccn'],
  ['ccv'],
  ['polyTouch'],
  ['midibend'],
  ['miditouch'],
  ['ctlNum'],
  ['frameRate'],
  ['frames'],
  ['hours'],
  ['midicmd'],
  ['minutes'],
  ['progNum'],
  ['seconds'],
  ['songPtr'],
  ['uid'],
  ['val'],
  ['cps'],
  /**
   * If set to 1, samples will be cut to the duration of their event.
   * In tidal, this would be done with legato, which [is about to land in strudel too](https://github.com/tidalcycles/strudel/issues/111)
   *
   * @name clip
   * @param {number | Pattern} active 1 or 0
   * @example
   * note("c a f e ~").s("piano").clip(1)
   *
   */
  ['clip'],
];

// TODO: slice / splice https://www.youtube.com/watch?v=hKhPdO0RKDQ&list=PL2lW1zNIIwj3bDkh-Y3LUGDuRcoUigoDs&index=13

controls.createParam = function (names) {
  const name = Array.isArray(names) ? names[0] : names;

  var withVal;
  if (Array.isArray(names)) {
    withVal = (xs) => {
      if (Array.isArray(xs)) {
        const result = {};
        xs.forEach((x, i) => {
          if (i < names.length) {
            result[names[i]] = x;
          }
        });
        return result;
      } else {
        return { [name]: xs };
      }
    };
  } else {
    withVal = (x) => ({ [name]: x });
  }

  const func = (...pats) => sequence(...pats).withValue(withVal);

  const setter = function (...pats) {
    if (!pats.length) {
      return this.fmap(withVal);
    }
    return this.set(func(...pats));
  };
  Pattern.prototype[name] = setter;
  return func;
};

generic_params.forEach(([names, ...aliases]) => {
  const name = Array.isArray(names) ? names[0] : names;
  controls[name] = controls.createParam(names);

  aliases.forEach((alias) => {
    controls[alias] = controls[name];
    Pattern.prototype[alias] = Pattern.prototype[name];
  });
});

controls.createParams = (...names) =>
  names.reduce((acc, name) => Object.assign(acc, { [name]: controls.createParam(name) }), {});

controls.adsr = register('adsr', (adsr, pat) => {
  adsr = !Array.isArray(adsr) ? [adsr] : adsr;
  const [attack, decay, sustain, release] = adsr;
  return pat.set({ attack, decay, sustain, release });
});
controls.ds = register('ds', (ds, pat) => {
  ds = !Array.isArray(ds) ? [ds] : ds;
  const [decay, sustain] = ds;
  return pat.set({ decay, sustain });
});

export default controls;
