import { c as createCommonjsModule, a as commonjsGlobal, g as getDefaultExportFromCjs } from './common/_commonjsHelpers-8c19dec8.js';
import { n as note, t as transpose$2, d as distance$1, m as modes, c as all, e as tokenizeNote, g as get$2, f as deprecate, h as isSupersetOf, j as all$1, k as isSubsetOf, l as get$3, o as interval, p as compact$1, q as toMidi, r as range$1, s as midiToNoteName, C as Core, u as index$5, v as index$1$1, w as index$1$2, x as index$6, y as index$7, b as index$8, z as index$9, A as index$a, B as index$1$3, a as index$b, D as index$c, i as index$d, E as accToAlt, F as altToAcc, G as coordToInterval, H as coordToNote, I as decode, J as encode, K as fillStr$1, L as isNamed, M as isPitch, N as stepToLetter, O as tokenizeInterval } from './common/index.es-d2606df1.js';

const fillStr = (character, times) => Array(times + 1).join(character);
const REGEX = /^(_{1,}|=|\^{1,}|)([abcdefgABCDEFG])([,']*)$/;
function tokenize(str) {
    const m = REGEX.exec(str);
    if (!m) {
        return ["", "", ""];
    }
    return [m[1], m[2], m[3]];
}
/**
 * Convert a (string) note in ABC notation into a (string) note in scientific notation
 *
 * @example
 * abcToScientificNotation("c") // => "C5"
 */
function abcToScientificNotation(str) {
    const [acc, letter, oct] = tokenize(str);
    if (letter === "") {
        return "";
    }
    let o = 4;
    for (let i = 0; i < oct.length; i++) {
        o += oct.charAt(i) === "," ? -1 : 1;
    }
    const a = acc[0] === "_"
        ? acc.replace(/_/g, "b")
        : acc[0] === "^"
            ? acc.replace(/\^/g, "#")
            : "";
    return letter.charCodeAt(0) > 96
        ? letter.toUpperCase() + a + (o + 1)
        : letter + a + o;
}
/**
 * Convert a (string) note in scientific notation into a (string) note in ABC notation
 *
 * @example
 * scientificToAbcNotation("C#4") // => "^C"
 */
function scientificToAbcNotation(str) {
    const n = note(str);
    if (n.empty || (!n.oct && n.oct !== 0)) {
        return "";
    }
    const { letter, acc, oct } = n;
    const a = acc[0] === "b" ? acc.replace(/b/g, "_") : acc.replace(/#/g, "^");
    const l = oct > 4 ? letter.toLowerCase() : letter;
    const o = oct === 5 ? "" : oct > 4 ? fillStr("'", oct - 5) : fillStr(",", 4 - oct);
    return a + l + o;
}
function transpose(note, interval) {
    return scientificToAbcNotation(transpose$2(abcToScientificNotation(note), interval));
}
function distance(from, to) {
    return distance$1(abcToScientificNotation(from), abcToScientificNotation(to));
}
var index = {
    abcToScientificNotation,
    scientificToAbcNotation,
    tokenize,
    transpose,
    distance,
};

// ascending range
function ascR(b, n) {
    const a = [];
    // tslint:disable-next-line:curly
    for (; n--; a[n] = n + b)
        ;
    return a;
}
// descending range
function descR(b, n) {
    const a = [];
    // tslint:disable-next-line:curly
    for (; n--; a[n] = b - n)
        ;
    return a;
}
/**
 * Creates a numeric range
 *
 * @param {number} from
 * @param {number} to
 * @return {Array<number>}
 *
 * @example
 * range(-2, 2) // => [-2, -1, 0, 1, 2]
 * range(2, -2) // => [2, 1, 0, -1, -2]
 */
function range(from, to) {
    return from < to ? ascR(from, to - from + 1) : descR(from, from - to + 1);
}
/**
 * Rotates a list a number of times. It"s completly agnostic about the
 * contents of the list.
 *
 * @param {Integer} times - the number of rotations
 * @param {Array} array
 * @return {Array} the rotated array
 *
 * @example
 * rotate(1, [1, 2, 3]) // => [2, 3, 1]
 */
function rotate(times, arr) {
    const len = arr.length;
    const n = ((times % len) + len) % len;
    return arr.slice(n, len).concat(arr.slice(0, n));
}
/**
 * Return a copy of the array with the null values removed
 * @function
 * @param {Array} array
 * @return {Array}
 *
 * @example
 * compact(["a", "b", null, "c"]) // => ["a", "b", "c"]
 */
function compact(arr) {
    return arr.filter((n) => n === 0 || n);
}
/**
 * Sort an array of notes in ascending order. Pitch classes are listed
 * before notes. Any string that is not a note is removed.
 *
 * @param {string[]} notes
 * @return {string[]} sorted array of notes
 *
 * @example
 * sortedNoteNames(['c2', 'c5', 'c1', 'c0', 'c6', 'c'])
 * // => ['C', 'C0', 'C1', 'C2', 'C5', 'C6']
 * sortedNoteNames(['c', 'F', 'G', 'a', 'b', 'h', 'J'])
 * // => ['C', 'F', 'G', 'A', 'B']
 */
function sortedNoteNames(notes) {
    const valid = notes.map((n) => note(n)).filter((n) => !n.empty);
    return valid.sort((a, b) => a.height - b.height).map((n) => n.name);
}
/**
 * Get sorted notes with duplicates removed. Pitch classes are listed
 * before notes.
 *
 * @function
 * @param {string[]} array
 * @return {string[]} unique sorted notes
 *
 * @example
 * Array.sortedUniqNoteNames(['a', 'b', 'c2', '1p', 'p2', 'c2', 'b', 'c', 'c3' ])
 * // => [ 'C', 'A', 'B', 'C2', 'C3' ]
 */
function sortedUniqNoteNames(arr) {
    return sortedNoteNames(arr).filter((n, i, a) => i === 0 || n !== a[i - 1]);
}
/**
 * Randomizes the order of the specified array in-place, using the Fisher–Yates shuffle.
 *
 * @function
 * @param {Array} array
 * @return {Array} the array shuffled
 *
 * @example
 * shuffle(["C", "D", "E", "F"]) // => [...]
 */
function shuffle(arr, rnd = Math.random) {
    let i;
    let t;
    let m = arr.length;
    while (m) {
        i = Math.floor(rnd() * m--);
        t = arr[m];
        arr[m] = arr[i];
        arr[i] = t;
    }
    return arr;
}
/**
 * Get all permutations of an array
 *
 * @param {Array} array - the array
 * @return {Array<Array>} an array with all the permutations
 * @example
 * permutations(["a", "b", "c"])) // =>
 * [
 *   ["a", "b", "c"],
 *   ["b", "a", "c"],
 *   ["b", "c", "a"],
 *   ["a", "c", "b"],
 *   ["c", "a", "b"],
 *   ["c", "b", "a"]
 * ]
 */
function permutations(arr) {
    if (arr.length === 0) {
        return [[]];
    }
    return permutations(arr.slice(1)).reduce((acc, perm) => {
        return acc.concat(arr.map((e, pos) => {
            const newPerm = perm.slice();
            newPerm.splice(pos, 0, arr[0]);
            return newPerm;
        }));
    }, []);
}

var index_es = /*#__PURE__*/Object.freeze({
    __proto__: null,
    compact: compact,
    permutations: permutations,
    range: range,
    rotate: rotate,
    shuffle: shuffle,
    sortedNoteNames: sortedNoteNames,
    sortedUniqNoteNames: sortedUniqNoteNames
});

const namedSet = (notes) => {
    const pcToName = notes.reduce((record, n) => {
        const chroma = note(n).chroma;
        if (chroma !== undefined) {
            record[chroma] = record[chroma] || note(n).name;
        }
        return record;
    }, {});
    return (chroma) => pcToName[chroma];
};
function detect(source) {
    const notes = source.map((n) => note(n).pc).filter((x) => x);
    if (note.length === 0) {
        return [];
    }
    const found = findExactMatches(notes, 1);
    return found
        .filter((chord) => chord.weight)
        .sort((a, b) => b.weight - a.weight)
        .map((chord) => chord.name);
}
function findExactMatches(notes, weight) {
    const tonic = notes[0];
    const tonicChroma = note(tonic).chroma;
    const noteName = namedSet(notes);
    // we need to test all chormas to get the correct baseNote
    const allModes = modes(notes, false);
    const found = [];
    allModes.forEach((mode, index) => {
        // some chords could have the same chroma but different interval spelling
        const chordTypes = all().filter((chordType) => chordType.chroma === mode);
        chordTypes.forEach((chordType) => {
            const chordName = chordType.aliases[0];
            const baseNote = noteName(index);
            const isInversion = index !== tonicChroma;
            if (isInversion) {
                found.push({
                    weight: 0.5 * weight,
                    name: `${baseNote}${chordName}/${tonic}`,
                });
            }
            else {
                found.push({ weight: 1 * weight, name: `${baseNote}${chordName}` });
            }
        });
    });
    return found;
}

const NoChord = {
    empty: true,
    name: "",
    symbol: "",
    root: "",
    rootDegree: 0,
    type: "",
    tonic: null,
    setNum: NaN,
    quality: "Unknown",
    chroma: "",
    normalized: "",
    aliases: [],
    notes: [],
    intervals: [],
};
// 6, 64, 7, 9, 11 and 13 are consider part of the chord
// (see https://github.com/danigb/tonal/issues/55)
const NUM_TYPES = /^(6|64|7|9|11|13)$/;
/**
 * Tokenize a chord name. It returns an array with the tonic and chord type
 * If not tonic is found, all the name is considered the chord name.
 *
 * This function does NOT check if the chord type exists or not. It only tries
 * to split the tonic and chord type.
 *
 * @function
 * @param {string} name - the chord name
 * @return {Array} an array with [tonic, type]
 * @example
 * tokenize("Cmaj7") // => [ "C", "maj7" ]
 * tokenize("C7") // => [ "C", "7" ]
 * tokenize("mMaj7") // => [ null, "mMaj7" ]
 * tokenize("Cnonsense") // => [ null, "nonsense" ]
 */
function tokenize$1(name) {
    const [letter, acc, oct, type] = tokenizeNote(name);
    if (letter === "") {
        return ["", name];
    }
    // aug is augmented (see https://github.com/danigb/tonal/issues/55)
    if (letter === "A" && type === "ug") {
        return ["", "aug"];
    }
    // see: https://github.com/tonaljs/tonal/issues/70
    if (!type && (oct === "4" || oct === "5")) {
        return [letter + acc, oct];
    }
    if (NUM_TYPES.test(oct)) {
        return [letter + acc, oct + type];
    }
    else {
        return [letter + acc + oct, type];
    }
}
/**
 * Get a Chord from a chord name.
 */
function get(src) {
    if (src === "") {
        return NoChord;
    }
    if (Array.isArray(src) && src.length === 2) {
        return getChord(src[1], src[0]);
    }
    else {
        const [tonic, type] = tokenize$1(src);
        const chord = getChord(type, tonic);
        return chord.empty ? getChord(src) : chord;
    }
}
/**
 * Get chord properties
 *
 * @param typeName - the chord type name
 * @param [tonic] - Optional tonic
 * @param [root]  - Optional root (requires a tonic)
 */
function getChord(typeName, optionalTonic, optionalRoot) {
    const type = get$2(typeName);
    const tonic = note(optionalTonic || "");
    const root = note(optionalRoot || "");
    if (type.empty ||
        (optionalTonic && tonic.empty) ||
        (optionalRoot && root.empty)) {
        return NoChord;
    }
    const rootInterval = distance$1(tonic.pc, root.pc);
    const rootDegree = type.intervals.indexOf(rootInterval) + 1;
    if (!root.empty && !rootDegree) {
        return NoChord;
    }
    const intervals = Array.from(type.intervals);
    for (let i = 1; i < rootDegree; i++) {
        const num = intervals[0][0];
        const quality = intervals[0][1];
        const newNum = parseInt(num, 10) + 7;
        intervals.push(`${newNum}${quality}`);
        intervals.shift();
    }
    const notes = tonic.empty
        ? []
        : intervals.map((i) => transpose$2(tonic, i));
    typeName = type.aliases.indexOf(typeName) !== -1 ? typeName : type.aliases[0];
    const symbol = `${tonic.empty ? "" : tonic.pc}${typeName}${root.empty || rootDegree <= 1 ? "" : "/" + root.pc}`;
    const name = `${optionalTonic ? tonic.pc + " " : ""}${type.name}${rootDegree > 1 && optionalRoot ? " over " + root.pc : ""}`;
    return {
        ...type,
        name,
        symbol,
        type: type.name,
        root: root.name,
        intervals,
        rootDegree,
        tonic: tonic.name,
        notes,
    };
}
const chord = deprecate("Chord.chord", "Chord.get", get);
/**
 * Transpose a chord name
 *
 * @param {string} chordName - the chord name
 * @return {string} the transposed chord
 *
 * @example
 * transpose('Dm7', 'P4') // => 'Gm7
 */
function transpose$1(chordName, interval) {
    const [tonic, type] = tokenize$1(chordName);
    if (!tonic) {
        return chordName;
    }
    return transpose$2(tonic, interval) + type;
}
/**
 * Get all scales where the given chord fits
 *
 * @example
 * chordScales('C7b9')
 * // => ["phrygian dominant", "flamenco", "spanish heptatonic", "half-whole diminished", "chromatic"]
 */
function chordScales(name) {
    const s = get(name);
    const isChordIncluded = isSupersetOf(s.chroma);
    return all$1()
        .filter((scale) => isChordIncluded(scale.chroma))
        .map((scale) => scale.name);
}
/**
 * Get all chords names that are a superset of the given one
 * (has the same notes and at least one more)
 *
 * @function
 * @example
 * extended("CMaj7")
 * // => [ 'Cmaj#4', 'Cmaj7#9#11', 'Cmaj9', 'CM7add13', 'Cmaj13', 'Cmaj9#11', 'CM13#11', 'CM7b9' ]
 */
function extended(chordName) {
    const s = get(chordName);
    const isSuperset = isSupersetOf(s.chroma);
    return all()
        .filter((chord) => isSuperset(chord.chroma))
        .map((chord) => s.tonic + chord.aliases[0]);
}
/**
 * Find all chords names that are a subset of the given one
 * (has less notes but all from the given chord)
 *
 * @example
 */
function reduced(chordName) {
    const s = get(chordName);
    const isSubset = isSubsetOf(s.chroma);
    return all()
        .filter((chord) => isSubset(chord.chroma))
        .map((chord) => s.tonic + chord.aliases[0]);
}
var index$1 = {
    getChord,
    get,
    detect,
    chordScales,
    extended,
    reduced,
    tokenize: tokenize$1,
    transpose: transpose$1,
    // deprecate
    chord,
};

/**
 * Given a tonic and a chord list expressed with roman numeral notation
 * returns the progression expressed with leadsheet chords symbols notation
 * @example
 * fromRomanNumerals("C", ["I", "IIm7", "V7"]);
 * // => ["C", "Dm7", "G7"]
 */
function fromRomanNumerals(tonic, chords) {
    const romanNumerals = chords.map(get$3);
    return romanNumerals.map((rn) => transpose$2(tonic, interval(rn)) + rn.chordType);
}
/**
 * Given a tonic and a chord list with leadsheet symbols notation,
 * return the chord list with roman numeral notation
 * @example
 * toRomanNumerals("C", ["CMaj7", "Dm7", "G7"]);
 * // => ["IMaj7", "IIm7", "V7"]
 */
function toRomanNumerals(tonic, chords) {
    return chords.map((chord) => {
        const [note, chordType] = tokenize$1(chord);
        const intervalName = distance$1(tonic, note);
        const roman = get$3(interval(intervalName));
        return roman.name + chordType;
    });
}
var index$2 = { fromRomanNumerals, toRomanNumerals };

/**
 * Create a numeric range. You supply a list of notes or numbers and it will
 * be connected to create complex ranges.
 *
 * @param {Array} notes - the list of notes or midi numbers used
 * @return {Array} an array of numbers or empty array if not valid parameters
 *
 * @example
 * numeric(["C5", "C4"]) // => [ 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60 ]
 * // it works midi notes
 * numeric([10, 5]) // => [ 10, 9, 8, 7, 6, 5 ]
 * // complex range
 * numeric(["C4", "E4", "Bb3"]) // => [60, 61, 62, 63, 64, 63, 62, 61, 60, 59, 58]
 */
function numeric(notes) {
    const midi = compact$1(notes.map(toMidi));
    if (!notes.length || midi.length !== notes.length) {
        // there is no valid notes
        return [];
    }
    return midi.reduce((result, note) => {
        const last = result[result.length - 1];
        return result.concat(range$1(last, note).slice(1));
    }, [midi[0]]);
}
/**
 * Create a range of chromatic notes. The altered notes will use flats.
 *
 * @function
 * @param {Array} notes - the list of notes or midi note numbers to create a range from
 * @param {Object} options - The same as `midiToNoteName` (`{ sharps: boolean, pitchClass: boolean }`)
 * @return {Array} an array of note names
 *
 * @example
 * Range.chromatic(["C2, "E2", "D2"]) // => ["C2", "Db2", "D2", "Eb2", "E2", "Eb2", "D2"]
 * // with sharps
 * Range.chromatic(["C2", "C3"], { sharps: true }) // => [ "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2", "C3" ]
 */
function chromatic(notes, options) {
    return numeric(notes).map((midi) => midiToNoteName(midi, options));
}
var index$3 = { numeric, chromatic };

// CONSTANTS
const NONE = {
    empty: true,
    name: "",
    upper: undefined,
    lower: undefined,
    type: undefined,
    additive: [],
};
const NAMES = ["4/4", "3/4", "2/4", "2/2", "12/8", "9/8", "6/8", "3/8"];
// PUBLIC API
function names() {
    return NAMES.slice();
}
const REGEX$1 = /^(\d?\d(?:\+\d)*)\/(\d)$/;
const CACHE = new Map();
function get$1(literal) {
    const cached = CACHE.get(literal);
    if (cached) {
        return cached;
    }
    const ts = build(parse(literal));
    CACHE.set(literal, ts);
    return ts;
}
function parse(literal) {
    if (typeof literal === "string") {
        const [_, up, low] = REGEX$1.exec(literal) || [];
        return parse([up, low]);
    }
    const [up, down] = literal;
    const denominator = +down;
    if (typeof up === "number") {
        return [up, denominator];
    }
    const list = up.split("+").map((n) => +n);
    return list.length === 1 ? [list[0], denominator] : [list, denominator];
}
var index$4 = { names, parse, get: get$1 };
// PRIVATE
function build([up, down]) {
    const upper = Array.isArray(up) ? up.reduce((a, b) => a + b, 0) : up;
    const lower = down;
    if (upper === 0 || lower === 0) {
        return NONE;
    }
    const name = Array.isArray(up) ? `${up.join("+")}/${down}` : `${up}/${down}`;
    const additive = Array.isArray(up) ? up : [];
    const type = lower === 4 || lower === 2
        ? "simple"
        : lower === 8 && upper % 3 === 0
            ? "compound"
            : "irregular";
    return {
        empty: false,
        name,
        type,
        upper,
        lower,
        additive,
    };
}

// deprecated (backwards compatibility)
const Tonal = Core;
const PcSet = index$5;
const ChordDictionary = index$1$1;
const ScaleDictionary = index$1$2;

var index_es$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Array: index_es,
    Core: Core,
    ChordDictionary: ChordDictionary,
    PcSet: PcSet,
    ScaleDictionary: ScaleDictionary,
    Tonal: Tonal,
    AbcNotation: index,
    Chord: index$1,
    ChordType: index$1$1,
    Collection: index$6,
    DurationValue: index$7,
    Interval: index$8,
    Key: index$9,
    Midi: index$a,
    Mode: index$1$3,
    Note: index$b,
    Pcset: index$5,
    Progression: index$2,
    Range: index$3,
    RomanNumeral: index$c,
    Scale: index$d,
    ScaleType: index$1$2,
    TimeSignature: index$4,
    accToAlt: accToAlt,
    altToAcc: altToAcc,
    coordToInterval: coordToInterval,
    coordToNote: coordToNote,
    decode: decode,
    deprecate: deprecate,
    distance: distance$1,
    encode: encode,
    fillStr: fillStr$1,
    interval: interval,
    isNamed: isNamed,
    isPitch: isPitch,
    note: note,
    stepToLetter: stepToLetter,
    tokenizeInterval: tokenizeInterval,
    tokenizeNote: tokenizeNote,
    transpose: transpose$2
});

var getBestVoicing_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
exports.getBestVoicing = void 0;
function getBestVoicing(voicingOptions) {
    var chord = voicingOptions.chord, range = voicingOptions.range, finder = voicingOptions.finder, picker = voicingOptions.picker, lastVoicing = voicingOptions.lastVoicing;
    var voicings = finder(chord, range);
    if (!voicings.length) {
        return [];
    }
    return picker(voicings, lastVoicing);
}
exports.getBestVoicing = getBestVoicing;

});

var tokenizeChord_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
exports.tokenizeChord = void 0;
function tokenizeChord(chord) {
    var match = (chord || '').match(/^([A-G][b#]*)([^\/]*)[\/]?([A-G][b#]*)?$/);
    if (!match) {
        // console.warn('could not tokenize chord', chord);
        return [];
    }
    return match.slice(1);
}
exports.tokenizeChord = tokenizeChord;

});

var voicingsInRange_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
exports.voicingsInRange = void 0;



function voicingsInRange(chord, dictionary, range) {
    if (dictionary === void 0) { dictionary = dictionaryVoicing_1.lefthand; }
    if (range === void 0) { range = ['D3', 'A4']; }
    var _a = (0, tokenizeChord_1.tokenizeChord)(chord), tonic = _a[0], symbol = _a[1];
    if (!dictionary[symbol]) {
        return [];
    }
    // resolve array of interval arrays for the wanted symbol
    var voicings = dictionary[symbol].map(function (intervals) { return intervals.split(' '); });
    var notesInRange = index_es$1.Range.chromatic(range); // gives array of notes inside range
    return voicings.reduce(function (voiced, voicing) {
        // transpose intervals relative to first interval (e.g. 3m 5P > 1P 3M)
        var relativeIntervals = voicing.map(function (interval) { return index_es$1.Interval.substract(interval, voicing[0]); });
        // get enharmonic correct pitch class the bottom note
        var bottomPitchClass = index_es$1.Note.transpose(tonic, voicing[0]);
        // get all possible start notes for voicing
        var starts = notesInRange
            // only get the start notes:
            .filter(function (note) { return index_es$1.Note.chroma(note) === index_es$1.Note.chroma(bottomPitchClass); })
            // filter out start notes that will overshoot the top end of the range
            .filter(function (note) {
            return index_es$1.Note.midi(index_es$1.Note.transpose(note, relativeIntervals[relativeIntervals.length - 1])) <= index_es$1.Note.midi(range[1]);
        })
            // replace Range.chromatic notes with the correct enharmonic equivalents
            .map(function (note) { return index_es$1.Note.enharmonic(note, bottomPitchClass); });
        // render one voicing for each start note
        var notes = starts.map(function (start) { return relativeIntervals.map(function (interval) { return index_es$1.Note.transpose(start, interval); }); });
        return voiced.concat(notes);
    }, []);
}
exports.voicingsInRange = voicingsInRange;

});

var dictionaryVoicing_1 = createCommonjsModule(function (module, exports) {
var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (commonjsGlobal && commonjsGlobal.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.dictionaryVoicing = exports.dictionaryVoicingFinder = exports.triads = exports.guidetones = exports.lefthand = void 0;


exports.lefthand = {
    m7: ['3m 5P 7m 9M', '7m 9M 10m 12P'],
    '7': ['3M 6M 7m 9M', '7m 9M 10M 13M'],
    '^7': ['3M 5P 7M 9M', '7M 9M 10M 12P'],
    '69': ['3M 5P 6A 9M'],
    m7b5: ['3m 5d 7m 8P', '7m 8P 10m 12d'],
    '7b9': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
    '7b13': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
    o7: ['1P 3m 5d 6M', '5d 6M 8P 10m'],
    '7#11': ['7m 9M 11A 13A'],
    '7#9': ['3M 7m 9A'],
    mM7: ['3m 5P 7M 9M', '7M 9M 10m 12P'],
    m6: ['3m 5P 6M 9M', '6M 9M 10m 12P']
};
exports.guidetones = {
    m7: ['3m 7m', '7m 10m'],
    m9: ['3m 7m', '7m 10m'],
    '7': ['3M 7m', '7m 10M'],
    '^7': ['3M 7M', '7M 10M'],
    '^9': ['3M 7M', '7M 10M'],
    '69': ['3M 6M'],
    '6': ['3M 6M', '6M 10M'],
    m7b5: ['3m 7m', '7m 10m'],
    '7b9': ['3M 7m', '7m 10M'],
    '7b13': ['3M 7m', '7m 10M'],
    o7: ['3m 6M', '6M 10m'],
    '7#11': ['3M 7m', '7m 10M'],
    '7#9': ['3M 7m', '7m 10M'],
    mM7: ['3m 7M', '7M 10m'],
    m6: ['3m 6M', '6M 10m']
};
exports.triads = {
    M: ['1P 3M 5P', '3M 5P 8P', '5P 8P 10M'],
    m: ['1P 3m 5P', '3m 5P 8P', '5P 8P 10m'],
    o: ['1P 3m 5d', '3m 5d 8P', '5d 8P 10m'],
    aug: ['1P 3m 5A', '3m 5A 8P', '5A 8P 10m']
};
var dictionaryVoicingFinder = function (dictionary) { return function (chordSymbol, range) {
    return (0, voicingsInRange_1.voicingsInRange)(chordSymbol, dictionary, range);
}; };
exports.dictionaryVoicingFinder = dictionaryVoicingFinder;
var dictionaryVoicing = function (props) {
    var dictionary = props.dictionary, range = props.range, rest = __rest(props, ["dictionary", "range"]);
    return (0, getBestVoicing_1.getBestVoicing)(__assign(__assign({}, rest), { range: range, finder: (0, exports.dictionaryVoicingFinder)(dictionary) }));
};
exports.dictionaryVoicing = dictionaryVoicing;

});

var minTopNoteDiff_1 = createCommonjsModule(function (module, exports) {
exports.__esModule = true;
exports.minTopNoteDiff = void 0;

function minTopNoteDiff(voicings, lastVoicing) {
    if (!lastVoicing) {
        return voicings[0];
    }
    var diff = function (voicing) {
        return Math.abs(index_es$1.Note.midi(lastVoicing[lastVoicing.length - 1]) - index_es$1.Note.midi(voicing[voicing.length - 1]));
    };
    return voicings.reduce(function (best, current) { return (diff(current) < diff(best) ? current : best); }, voicings[0]);
}
exports.minTopNoteDiff = minTopNoteDiff;

});

var dist = createCommonjsModule(function (module, exports) {
exports.__esModule = true;




exports["default"] = {
    tokenizeChord: tokenizeChord_1.tokenizeChord,
    getBestVoicing: getBestVoicing_1.getBestVoicing,
    dictionaryVoicing: dictionaryVoicing_1.dictionaryVoicing,
    dictionaryVoicingFinder: dictionaryVoicing_1.dictionaryVoicingFinder,
    lefthand: dictionaryVoicing_1.lefthand,
    guidetones: dictionaryVoicing_1.guidetones,
    triads: dictionaryVoicing_1.triads,
    minTopNoteDiff: minTopNoteDiff_1.minTopNoteDiff
};

});

var __pika_web_default_export_for_treeshaking__ = /*@__PURE__*/getDefaultExportFromCjs(dist);

export default __pika_web_default_export_for_treeshaking__;
