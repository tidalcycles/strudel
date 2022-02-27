import { T as ToneAudioNode, V as Volume, F as Frequency, M as Midi, S as Sampler, a as ToneAudioBuffers, b as ToneBufferSource, o as optionsFromArguments, G as Gain, i as isString } from '../common/index-b6fc655f.js';
import '../common/webmidi.min-97732fd4.js';
import '../common/_commonjsHelpers-8c19dec8.js';

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Base class for the other components
 */
class PianoComponent extends ToneAudioNode {
    constructor(options) {
        super(options);
        this.name = 'PianoComponent';
        this.input = undefined;
        this.output = new Volume({ context: this.context });
        /**
         * If the component is enabled or not
         */
        this._enabled = false;
        /**
         * The volume output of the component
         */
        this.volume = this.output.volume;
        /**
         * Boolean indication of if the component is loaded or not
         */
        this._loaded = false;
        this.volume.value = options.volume;
        this._enabled = options.enabled;
        this.samples = options.samples;
    }
    /**
     * If the samples are loaded or not
     */
    get loaded() {
        return this._loaded;
    }
    /**
     * Load the samples
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._enabled) {
                yield this._internalLoad();
                this._loaded = true;
            }
            else {
                return Promise.resolve();
            }
        });
    }
}

// import * as Tone from '../node_modules/tone/Tone'
function midiToNote(midi) {
    const frequency = Frequency(midi, 'midi');
    const ret = frequency.toNote();
    return ret;
}
function randomBetween(low, high) {
    return Math.random() * (high - low) + low;
}

function getReleasesUrl(midi) {
    return `rel${midi - 20}.[mp3|ogg]`;
}
function getHarmonicsUrl(midi) {
    return `harmS${midiToNote(midi).replace('#', 's')}.[mp3|ogg]`;
}
function getNotesUrl(midi, vel) {
    return `${midiToNote(midi).replace('#', 's')}v${vel}.[mp3|ogg]`;
}
/**
 * Maps velocity depths to Salamander velocities
 */
const velocitiesMap = {
    1: [8],
    2: [6, 12],
    3: [1, 7, 15],
    4: [1, 5, 10, 15],
    5: [1, 4, 8, 12, 16],
    6: [1, 3, 7, 10, 13, 16],
    7: [1, 3, 6, 9, 11, 13, 16],
    8: [1, 3, 5, 7, 9, 11, 13, 16],
    9: [1, 3, 5, 7, 9, 11, 13, 15, 16],
    10: [1, 2, 3, 5, 7, 9, 11, 13, 15, 16],
    11: [1, 2, 3, 5, 7, 9, 11, 13, 14, 15, 16],
    12: [1, 2, 3, 4, 5, 7, 9, 11, 13, 14, 15, 16],
    13: [1, 2, 3, 4, 5, 7, 9, 11, 12, 13, 14, 15, 16],
    14: [1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16],
    15: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16],
    16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
};
/**
 * All the notes of audio samples
 */
const allNotes = [
    21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54,
    57, 60, 63, 66, 69, 72, 75, 78, 81, 84,
    87, 90, 93, 96, 99, 102, 105, 108
];
function getNotesInRange(min, max) {
    return allNotes.filter(note => min <= note && note <= max);
}
/**
 * All the notes of audio samples
 */
const harmonics = [21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87];
function getHarmonicsInRange(min, max) {
    return harmonics.filter(note => min <= note && note <= max);
}
function inHarmonicsRange(note) {
    return harmonics[0] <= note && note <= harmonics[harmonics.length - 1];
}

class Harmonics extends PianoComponent {
    constructor(options) {
        super(options);
        this._urls = {};
        const notes = getHarmonicsInRange(options.minNote, options.maxNote);
        for (const n of notes) {
            this._urls[n] = getHarmonicsUrl(n);
        }
    }
    triggerAttack(note, time, velocity) {
        if (this._enabled && inHarmonicsRange(note)) {
            this._sampler.triggerAttack(Midi(note).toNote(), time, velocity * randomBetween(0.5, 1));
        }
    }
    _internalLoad() {
        return new Promise(onload => {
            this._sampler = new Sampler({
                baseUrl: this.samples,
                onload,
                urls: this._urls,
            }).connect(this.output);
        });
    }
}

class Keybed extends PianoComponent {
    constructor(options) {
        super(options);
        /**
         * The urls to load
         */
        this._urls = {};
        for (let i = options.minNote; i <= options.maxNote; i++) {
            this._urls[i] = getReleasesUrl(i);
        }
    }
    _internalLoad() {
        return new Promise(success => {
            this._buffers = new ToneAudioBuffers(this._urls, success, this.samples);
        });
    }
    start(note, time, velocity) {
        if (this._enabled && this._buffers.has(note)) {
            const source = new ToneBufferSource({
                url: this._buffers.get(note),
                context: this.context,
            }).connect(this.output);
            // randomize the velocity slightly
            source.start(time, 0, undefined, 0.015 * velocity * randomBetween(0.5, 1));
        }
    }
}

class Pedal extends PianoComponent {
    constructor(options) {
        super(options);
        this._downTime = Infinity;
        this._currentSound = null;
        this._downTime = Infinity;
    }
    _internalLoad() {
        return new Promise((success) => {
            this._buffers = new ToneAudioBuffers({
                down1: 'pedalD1.mp3',
                down2: 'pedalD2.mp3',
                up1: 'pedalU1.mp3',
                up2: 'pedalU2.mp3',
            }, success, this.samples);
        });
    }
    /**
     *  Squash the current playing sound
     */
    _squash(time) {
        if (this._currentSound && this._currentSound.state !== 'stopped') {
            this._currentSound.stop(time);
        }
        this._currentSound = null;
    }
    _playSample(time, dir) {
        if (this._enabled) {
            this._currentSound = new ToneBufferSource({
                url: this._buffers.get(`${dir}${Math.random() > 0.5 ? 1 : 2}`),
                context: this.context,
                curve: 'exponential',
                fadeIn: 0.05,
                fadeOut: 0.1,
            }).connect(this.output);
            this._currentSound.start(time, randomBetween(0, 0.01), undefined, 0.1 * randomBetween(0.5, 1));
        }
    }
    /**
     * Put the pedal down
     */
    down(time) {
        this._squash(time);
        this._downTime = time;
        this._playSample(time, 'down');
    }
    /**
     * Put the pedal up
     */
    up(time) {
        this._squash(time);
        this._downTime = Infinity;
        this._playSample(time, 'up');
    }
    /**
     * Indicates if the pedal is down at the given time
     */
    isDown(time) {
        return time > this._downTime;
    }
}

/**
 * A single velocity of strings
 */
class PianoString extends ToneAudioNode {
    constructor(options) {
        super(options);
        this.name = 'PianoString';
        this._urls = {};
        // create the urls
        options.notes.forEach(note => this._urls[note] = getNotesUrl(note, options.velocity));
        this.samples = options.samples;
    }
    load() {
        return new Promise(onload => {
            this._sampler = this.output = new Sampler({
                attack: 0,
                baseUrl: this.samples,
                curve: 'exponential',
                onload,
                release: 0.4,
                urls: this._urls,
                volume: 3,
            });
        });
    }
    triggerAttack(note, time, velocity) {
        this._sampler.triggerAttack(note, time, velocity);
    }
    triggerRelease(note, time) {
        this._sampler.triggerRelease(note, time);
    }
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 *  Manages all of the hammered string sounds
 */
class PianoStrings extends PianoComponent {
    constructor(options) {
        super(options);
        const notes = getNotesInRange(options.minNote, options.maxNote);
        const velocities = velocitiesMap[options.velocities].slice();
        this._strings = velocities.map(velocity => {
            const string = new PianoString(Object.assign(options, {
                notes, velocity,
            }));
            return string;
        });
        this._activeNotes = new Map();
    }
    /**
     * Scale a value between a given range
     */
    scale(val, inMin, inMax, outMin, outMax) {
        return ((val - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
    }
    triggerAttack(note, time, velocity) {
        const scaledVel = this.scale(velocity, 0, 1, -0.5, this._strings.length - 0.51);
        const stringIndex = Math.max(Math.round(scaledVel), 0);
        let gain = 1 + scaledVel - stringIndex;
        if (this._strings.length === 1) {
            gain = velocity;
        }
        const sampler = this._strings[stringIndex];
        if (this._activeNotes.has(note)) {
            this.triggerRelease(note, time);
        }
        this._activeNotes.set(note, sampler);
        sampler.triggerAttack(Midi(note).toNote(), time, gain);
    }
    triggerRelease(note, time) {
        // trigger the release of all of the notes at that velociy
        if (this._activeNotes.has(note)) {
            this._activeNotes.get(note).triggerRelease(Midi(note).toNote(), time);
            this._activeNotes.delete(note);
        }
    }
    _internalLoad() {
        return __awaiter$1(this, void 0, void 0, function* () {
            yield Promise.all(this._strings.map((s) => __awaiter$1(this, void 0, void 0, function* () {
                yield s.load();
                s.connect(this.output);
            })));
        });
    }
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 *  The Piano
 */
class Piano extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Piano.getDefaults(), arguments));
        this.name = 'Piano';
        this.input = undefined;
        this.output = new Gain({ context: this.context });
        /**
         * The currently held notes
         */
        this._heldNotes = new Map();
        /**
         * If it's loaded or not
         */
        this._loaded = false;
        const options = optionsFromArguments(Piano.getDefaults(), arguments);
        // make sure it ends with a /
        if (!options.url.endsWith('/')) {
            options.url += '/';
        }
        this.maxPolyphony = options.maxPolyphony;
        this._heldNotes = new Map();
        this._sustainedNotes = new Map();
        this._strings = new PianoStrings(Object.assign({}, options, {
            enabled: true,
            samples: options.url,
            volume: options.volume.strings,
        })).connect(this.output);
        this.strings = this._strings.volume;
        this._pedal = new Pedal(Object.assign({}, options, {
            enabled: options.pedal,
            samples: options.url,
            volume: options.volume.pedal,
        })).connect(this.output);
        this.pedal = this._pedal.volume;
        this._keybed = new Keybed(Object.assign({}, options, {
            enabled: options.release,
            samples: options.url,
            volume: options.volume.keybed,
        })).connect(this.output);
        this.keybed = this._keybed.volume;
        this._harmonics = new Harmonics(Object.assign({}, options, {
            enabled: options.release,
            samples: options.url,
            volume: options.volume.harmonics,
        })).connect(this.output);
        this.harmonics = this._harmonics.volume;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            maxNote: 108,
            minNote: 21,
            pedal: true,
            release: false,
            url: 'https://tambien.github.io/Piano/audio/',
            velocities: 1,
            maxPolyphony: 32,
            volume: {
                harmonics: 0,
                keybed: 0,
                pedal: 0,
                strings: 0,
            },
        });
    }
    /**
     *  Load all the samples
     */
    load() {
        return __awaiter$2(this, void 0, void 0, function* () {
            yield Promise.all([
                this._strings.load(),
                this._pedal.load(),
                this._keybed.load(),
                this._harmonics.load(),
            ]);
            this._loaded = true;
        });
    }
    /**
     * If all the samples are loaded or not
     */
    get loaded() {
        return this._loaded;
    }
    /**
     *  Put the pedal down at the given time. Causes subsequent
     *  notes and currently held notes to sustain.
     */
    pedalDown({ time = this.immediate() } = {}) {
        if (this.loaded) {
            time = this.toSeconds(time);
            if (!this._pedal.isDown(time)) {
                this._pedal.down(time);
            }
        }
        return this;
    }
    /**
     *  Put the pedal up. Dampens sustained notes
     */
    pedalUp({ time = this.immediate() } = {}) {
        if (this.loaded) {
            const seconds = this.toSeconds(time);
            if (this._pedal.isDown(seconds)) {
                this._pedal.up(seconds);
                // dampen each of the notes
                this._sustainedNotes.forEach((t, note) => {
                    if (!this._heldNotes.has(note)) {
                        this._strings.triggerRelease(note, seconds);
                    }
                });
                this._sustainedNotes.clear();
            }
        }
        return this;
    }
    /**
     *  Play a note.
     *  @param note	  The note to play. If it is a number, it is assumed to be MIDI
     *  @param velocity  The velocity to play the note
     *  @param time	  The time of the event
     */
    keyDown({ note, midi, time = this.immediate(), velocity = 0.8 }) {
        if (this.loaded && this.maxPolyphony > this._heldNotes.size + this._sustainedNotes.size) {
            time = this.toSeconds(time);
            if (isString(note)) {
                midi = Math.round(Midi(note).toMidi());
            }
            if (!this._heldNotes.has(midi)) {
                // record the start time and velocity
                this._heldNotes.set(midi, { time, velocity });
                this._strings.triggerAttack(midi, time, velocity);
            }
        }
        else {
            console.warn('samples not loaded');
        }
        return this;
    }
    /**
     *  Release a held note.
     */
    keyUp({ note, midi, time = this.immediate(), velocity = 0.8 }) {
        if (this.loaded) {
            time = this.toSeconds(time);
            if (isString(note)) {
                midi = Math.round(Midi(note).toMidi());
            }
            if (this._heldNotes.has(midi)) {
                const prevNote = this._heldNotes.get(midi);
                this._heldNotes.delete(midi);
                // compute the release velocity
                const holdTime = Math.pow(Math.max(time - prevNote.time, 0.1), 0.7);
                const prevVel = prevNote.velocity;
                let dampenGain = (3 / holdTime) * prevVel * velocity;
                dampenGain = Math.max(dampenGain, 0.4);
                dampenGain = Math.min(dampenGain, 4);
                if (this._pedal.isDown(time)) {
                    if (!this._sustainedNotes.has(midi)) {
                        this._sustainedNotes.set(midi, time);
                    }
                }
                else {
                    // release the string sound
                    this._strings.triggerRelease(midi, time);
                    // trigger the harmonics sound
                    this._harmonics.triggerAttack(midi, time, dampenGain);
                }
                // trigger the keybed release sound
                this._keybed.start(midi, time, velocity);
            }
        }
        return this;
    }
    stopAll() {
        this.pedalUp();
        this._heldNotes.forEach((_, midi) => {
            this.keyUp({ midi });
        });
        return this;
    }
}

var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

export { Piano };
