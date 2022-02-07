/**
 * Fill a string with a repeated character
 *
 * @param character
 * @param repetition
 */
const fillStr = (s, n) => Array(Math.abs(n) + 1).join(s);
function deprecate(original, alternative, fn) {
    return function (...args) {
        // tslint:disable-next-line
        console.warn(`${original} is deprecated. Use ${alternative}.`);
        return fn.apply(this, args);
    };
}

function isNamed(src) {
    return src !== null && typeof src === "object" && typeof src.name === "string"
        ? true
        : false;
}

function isPitch(pitch) {
    return pitch !== null &&
        typeof pitch === "object" &&
        typeof pitch.step === "number" &&
        typeof pitch.alt === "number"
        ? true
        : false;
}
// The number of fifths of [C, D, E, F, G, A, B]
const FIFTHS = [0, 2, 4, -1, 1, 3, 5];
// The number of octaves it span each step
const STEPS_TO_OCTS = FIFTHS.map((fifths) => Math.floor((fifths * 7) / 12));
function encode(pitch) {
    const { step, alt, oct, dir = 1 } = pitch;
    const f = FIFTHS[step] + 7 * alt;
    if (oct === undefined) {
        return [dir * f];
    }
    const o = oct - STEPS_TO_OCTS[step] - 4 * alt;
    return [dir * f, dir * o];
}
// We need to get the steps from fifths
// Fifths for CDEFGAB are [ 0, 2, 4, -1, 1, 3, 5 ]
// We add 1 to fifths to avoid negative numbers, so:
// for ["F", "C", "G", "D", "A", "E", "B"] we have:
const FIFTHS_TO_STEPS = [3, 0, 4, 1, 5, 2, 6];
function decode(coord) {
    const [f, o, dir] = coord;
    const step = FIFTHS_TO_STEPS[unaltered(f)];
    const alt = Math.floor((f + 1) / 7);
    if (o === undefined) {
        return { step, alt, dir };
    }
    const oct = o + 4 * alt + STEPS_TO_OCTS[step];
    return { step, alt, oct, dir };
}
// Return the number of fifths as if it were unaltered
function unaltered(f) {
    const i = (f + 1) % 7;
    return i < 0 ? 7 + i : i;
}

const NoNote = { empty: true, name: "", pc: "", acc: "" };
const cache$1 = new Map();
const stepToLetter = (step) => "CDEFGAB".charAt(step);
const altToAcc = (alt) => alt < 0 ? fillStr("b", -alt) : fillStr("#", alt);
const accToAlt = (acc) => acc[0] === "b" ? -acc.length : acc.length;
/**
 * Given a note literal (a note name or a note object), returns the Note object
 * @example
 * note('Bb4') // => { name: "Bb4", midi: 70, chroma: 10, ... }
 */
function note(src) {
    const cached = cache$1.get(src);
    if (cached) {
        return cached;
    }
    const value = typeof src === "string"
        ? parse$1(src)
        : isPitch(src)
            ? note(pitchName$1(src))
            : isNamed(src)
                ? note(src.name)
                : NoNote;
    cache$1.set(src, value);
    return value;
}
const REGEX$1 = /^([a-gA-G]?)(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)$/;
/**
 * @private
 */
function tokenizeNote(str) {
    const m = REGEX$1.exec(str);
    return [m[1].toUpperCase(), m[2].replace(/x/g, "##"), m[3], m[4]];
}
/**
 * @private
 */
function coordToNote(noteCoord) {
    return note(decode(noteCoord));
}
const mod = (n, m) => ((n % m) + m) % m;
const SEMI = [0, 2, 4, 5, 7, 9, 11];
function parse$1(noteName) {
    const tokens = tokenizeNote(noteName);
    if (tokens[0] === "" || tokens[3] !== "") {
        return NoNote;
    }
    const letter = tokens[0];
    const acc = tokens[1];
    const octStr = tokens[2];
    const step = (letter.charCodeAt(0) + 3) % 7;
    const alt = accToAlt(acc);
    const oct = octStr.length ? +octStr : undefined;
    const coord = encode({ step, alt, oct });
    const name = letter + acc + octStr;
    const pc = letter + acc;
    const chroma = (SEMI[step] + alt + 120) % 12;
    const height = oct === undefined
        ? mod(SEMI[step] + alt, 12) - 12 * 99
        : SEMI[step] + alt + 12 * (oct + 1);
    const midi = height >= 0 && height <= 127 ? height : null;
    const freq = oct === undefined ? null : Math.pow(2, (height - 69) / 12) * 440;
    return {
        empty: false,
        acc,
        alt,
        chroma,
        coord,
        freq,
        height,
        letter,
        midi,
        name,
        oct,
        pc,
        step,
    };
}
function pitchName$1(props) {
    const { step, alt, oct } = props;
    const letter = stepToLetter(step);
    if (!letter) {
        return "";
    }
    const pc = letter + altToAcc(alt);
    return oct || oct === 0 ? pc + oct : pc;
}

const NoInterval = { empty: true, name: "", acc: "" };
// shorthand tonal notation (with quality after number)
const INTERVAL_TONAL_REGEX = "([-+]?\\d+)(d{1,4}|m|M|P|A{1,4})";
// standard shorthand notation (with quality before number)
const INTERVAL_SHORTHAND_REGEX = "(AA|A|P|M|m|d|dd)([-+]?\\d+)";
const REGEX = new RegExp("^" + INTERVAL_TONAL_REGEX + "|" + INTERVAL_SHORTHAND_REGEX + "$");
/**
 * @private
 */
function tokenizeInterval(str) {
    const m = REGEX.exec(`${str}`);
    if (m === null) {
        return ["", ""];
    }
    return m[1] ? [m[1], m[2]] : [m[4], m[3]];
}
const cache = {};
/**
 * Get interval properties. It returns an object with:
 *
 * - name: the interval name
 * - num: the interval number
 * - type: 'perfectable' or 'majorable'
 * - q: the interval quality (d, m, M, A)
 * - dir: interval direction (1 ascending, -1 descending)
 * - simple: the simplified number
 * - semitones: the size in semitones
 * - chroma: the interval chroma
 *
 * @param {string} interval - the interval name
 * @return {Object} the interval properties
 *
 * @example
 * import { interval } from '@tonaljs/core'
 * interval('P5').semitones // => 7
 * interval('m3').type // => 'majorable'
 */
function interval(src) {
    return typeof src === "string"
        ? cache[src] || (cache[src] = parse(src))
        : isPitch(src)
            ? interval(pitchName(src))
            : isNamed(src)
                ? interval(src.name)
                : NoInterval;
}
const SIZES = [0, 2, 4, 5, 7, 9, 11];
const TYPES = "PMMPPMM";
function parse(str) {
    const tokens = tokenizeInterval(str);
    if (tokens[0] === "") {
        return NoInterval;
    }
    const num = +tokens[0];
    const q = tokens[1];
    const step = (Math.abs(num) - 1) % 7;
    const t = TYPES[step];
    if (t === "M" && q === "P") {
        return NoInterval;
    }
    const type = t === "M" ? "majorable" : "perfectable";
    const name = "" + num + q;
    const dir = num < 0 ? -1 : 1;
    const simple = num === 8 || num === -8 ? num : dir * (step + 1);
    const alt = qToAlt(type, q);
    const oct = Math.floor((Math.abs(num) - 1) / 7);
    const semitones = dir * (SIZES[step] + alt + 12 * oct);
    const chroma = (((dir * (SIZES[step] + alt)) % 12) + 12) % 12;
    const coord = encode({ step, alt, oct, dir });
    return {
        empty: false,
        name,
        num,
        q,
        step,
        alt,
        dir,
        type,
        simple,
        semitones,
        chroma,
        coord,
        oct,
    };
}
/**
 * @private
 *
 * forceDescending is used in the case of unison (#243)
 */
function coordToInterval(coord, forceDescending) {
    const [f, o = 0] = coord;
    const isDescending = f * 7 + o * 12 < 0;
    const ivl = forceDescending || isDescending ? [-f, -o, -1] : [f, o, 1];
    return interval(decode(ivl));
}
function qToAlt(type, q) {
    return (q === "M" && type === "majorable") ||
        (q === "P" && type === "perfectable")
        ? 0
        : q === "m" && type === "majorable"
            ? -1
            : /^A+$/.test(q)
                ? q.length
                : /^d+$/.test(q)
                    ? -1 * (type === "perfectable" ? q.length : q.length + 1)
                    : 0;
}
// return the interval name of a pitch
function pitchName(props) {
    const { step, alt, oct = 0, dir } = props;
    if (!dir) {
        return "";
    }
    const calcNum = step + 1 + 7 * oct;
    // this is an edge case: descending pitch class unison (see #243)
    const num = calcNum === 0 ? step + 1 : calcNum;
    const d = dir < 0 ? "-" : "";
    const type = TYPES[step] === "M" ? "majorable" : "perfectable";
    const name = d + num + altToQ(type, alt);
    return name;
}
function altToQ(type, alt) {
    if (alt === 0) {
        return type === "majorable" ? "M" : "P";
    }
    else if (alt === -1 && type === "majorable") {
        return "m";
    }
    else if (alt > 0) {
        return fillStr("A", alt);
    }
    else {
        return fillStr("d", type === "perfectable" ? alt : alt + 1);
    }
}

/**
 * Transpose a note by an interval.
 *
 * @param {string} note - the note or note name
 * @param {string} interval - the interval or interval name
 * @return {string} the transposed note name or empty string if not valid notes
 * @example
 * import { tranpose } from "@tonaljs/core"
 * transpose("d3", "3M") // => "F#3"
 * transpose("D", "3M") // => "F#"
 * ["C", "D", "E", "F", "G"].map(pc => transpose(pc, "M3)) // => ["E", "F#", "G#", "A", "B"]
 */
function transpose(noteName, intervalName) {
    const note$1 = note(noteName);
    const interval$1 = interval(intervalName);
    if (note$1.empty || interval$1.empty) {
        return "";
    }
    const noteCoord = note$1.coord;
    const intervalCoord = interval$1.coord;
    const tr = noteCoord.length === 1
        ? [noteCoord[0] + intervalCoord[0]]
        : [noteCoord[0] + intervalCoord[0], noteCoord[1] + intervalCoord[1]];
    return coordToNote(tr).name;
}
/**
 * Find the interval distance between two notes or coord classes.
 *
 * To find distance between coord classes, both notes must be coord classes and
 * the interval is always ascending
 *
 * @param {Note|string} from - the note or note name to calculate distance from
 * @param {Note|string} to - the note or note name to calculate distance to
 * @return {string} the interval name or empty string if not valid notes
 *
 */
function distance(fromNote, toNote) {
    const from = note(fromNote);
    const to = note(toNote);
    if (from.empty || to.empty) {
        return "";
    }
    const fcoord = from.coord;
    const tcoord = to.coord;
    const fifths = tcoord[0] - fcoord[0];
    const octs = fcoord.length === 2 && tcoord.length === 2
        ? tcoord[1] - fcoord[1]
        : -Math.floor((fifths * 7) / 12);
    // If it's unison and not pitch class, it can be descending interval (#243)
    const forceDescending = to.height === from.height &&
        to.midi !== null &&
        from.midi !== null &&
        from.step > to.step;
    return coordToInterval([fifths, octs], forceDescending).name;
}

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
 * @param {Array} collection
 * @return {Array} the rotated collection
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
 * Return a copy of the collection with the null values removed
 * @function
 * @param {Array} collection
 * @return {Array}
 *
 * @example
 * compact(["a", "b", null, "c"]) // => ["a", "b", "c"]
 */
function compact(arr) {
    return arr.filter((n) => n === 0 || n);
}

const EmptyPcset = {
    empty: true,
    name: "",
    setNum: 0,
    chroma: "000000000000",
    normalized: "000000000000",
    intervals: [],
};
// UTILITIES
const setNumToChroma = (num) => Number(num).toString(2);
const chromaToNumber = (chroma) => parseInt(chroma, 2);
const REGEX$2 = /^[01]{12}$/;
function isChroma(set) {
    return REGEX$2.test(set);
}
const isPcsetNum = (set) => typeof set === "number" && set >= 0 && set <= 4095;
const isPcset = (set) => set && isChroma(set.chroma);
const cache$2 = { [EmptyPcset.chroma]: EmptyPcset };
/**
 * Get the pitch class set of a collection of notes or set number or chroma
 */
function get(src) {
    const chroma = isChroma(src)
        ? src
        : isPcsetNum(src)
            ? setNumToChroma(src)
            : Array.isArray(src)
                ? listToChroma(src)
                : isPcset(src)
                    ? src.chroma
                    : EmptyPcset.chroma;
    return (cache$2[chroma] = cache$2[chroma] || chromaToPcset(chroma));
}
const IVLS = [
    "1P",
    "2m",
    "2M",
    "3m",
    "3M",
    "4P",
    "5d",
    "5P",
    "6m",
    "6M",
    "7m",
    "7M",
];
/**
 * @private
 * Get the intervals of a pcset *starting from C*
 * @param {Set} set - the pitch class set
 * @return {IntervalName[]} an array of interval names or an empty array
 * if not a valid pitch class set
 */
function chromaToIntervals(chroma) {
    const intervals = [];
    for (let i = 0; i < 12; i++) {
        // tslint:disable-next-line:curly
        if (chroma.charAt(i) === "1")
            intervals.push(IVLS[i]);
    }
    return intervals;
}
/**
 * Given a a list of notes or a pcset chroma, produce the rotations
 * of the chroma discarding the ones that starts with "0"
 *
 * This is used, for example, to get all the modes of a scale.
 *
 * @param {Array|string} set - the list of notes or pitchChr of the set
 * @param {boolean} normalize - (Optional, true by default) remove all
 * the rotations that starts with "0"
 * @return {Array<string>} an array with all the modes of the chroma
 *
 * @example
 * Pcset.modes(["C", "D", "E"]).map(Pcset.intervals)
 */
function modes(set, normalize = true) {
    const pcs = get(set);
    const binary = pcs.chroma.split("");
    return compact(binary.map((_, i) => {
        const r = rotate(i, binary);
        return normalize && r[0] === "0" ? null : r.join("");
    }));
}
/**
 * Create a function that test if a collection of notes is a
 * subset of a given set
 *
 * The function is curryfied.
 *
 * @param {PcsetChroma|NoteName[]} set - the superset to test against (chroma or
 * list of notes)
 * @return{function(PcsetChroma|NoteNames[]): boolean} a function accepting a set
 * to test against (chroma or list of notes)
 * @example
 * const inCMajor = Pcset.isSubsetOf(["C", "E", "G"])
 * inCMajor(["e6", "c4"]) // => true
 * inCMajor(["e6", "c4", "d3"]) // => false
 */
function isSubsetOf(set) {
    const s = get(set).setNum;
    return (notes) => {
        const o = get(notes).setNum;
        // tslint:disable-next-line: no-bitwise
        return s && s !== o && (o & s) === o;
    };
}
/**
 * Create a function that test if a collection of notes is a
 * superset of a given set (it contains all notes and at least one more)
 *
 * @param {Set} set - an array of notes or a chroma set string to test against
 * @return {(subset: Set): boolean} a function that given a set
 * returns true if is a subset of the first one
 * @example
 * const extendsCMajor = Pcset.isSupersetOf(["C", "E", "G"])
 * extendsCMajor(["e6", "a", "c4", "g2"]) // => true
 * extendsCMajor(["c6", "e4", "g3"]) // => false
 */
function isSupersetOf(set) {
    const s = get(set).setNum;
    return (notes) => {
        const o = get(notes).setNum;
        // tslint:disable-next-line: no-bitwise
        return s && s !== o && (o | s) === o;
    };
}
//// PRIVATE ////
function chromaRotations(chroma) {
    const binary = chroma.split("");
    return binary.map((_, i) => rotate(i, binary).join(""));
}
function chromaToPcset(chroma) {
    const setNum = chromaToNumber(chroma);
    const normalizedNum = chromaRotations(chroma)
        .map(chromaToNumber)
        .filter((n) => n >= 2048)
        .sort()[0];
    const normalized = setNumToChroma(normalizedNum);
    const intervals = chromaToIntervals(chroma);
    return {
        empty: false,
        name: "",
        setNum,
        chroma,
        normalized,
        intervals,
    };
}
function listToChroma(set) {
    if (set.length === 0) {
        return EmptyPcset.chroma;
    }
    let pitch;
    const binary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < set.length; i++) {
        pitch = note(set[i]);
        // tslint:disable-next-line: curly
        if (pitch.empty)
            pitch = interval(set[i]);
        // tslint:disable-next-line: curly
        if (!pitch.empty)
            binary[pitch.chroma] = 1;
    }
    return binary.join("");
}

/**
 * @private
 * Chord List
 * Source: https://en.wikibooks.org/wiki/Music_Theory/Complete_List_of_Chord_Patterns
 * Format: ["intervals", "full name", "abrv1 abrv2"]
 */
const CHORDS = [
    // ==Major==
    ["1P 3M 5P", "major", "M ^ "],
    ["1P 3M 5P 7M", "major seventh", "maj7 Δ ma7 M7 Maj7 ^7"],
    ["1P 3M 5P 7M 9M", "major ninth", "maj9 Δ9 ^9"],
    ["1P 3M 5P 7M 9M 13M", "major thirteenth", "maj13 Maj13 ^13"],
    ["1P 3M 5P 6M", "sixth", "6 add6 add13 M6"],
    ["1P 3M 5P 6M 9M", "sixth/ninth", "6/9 69 M69"],
    ["1P 3M 6m 7M", "major seventh flat sixth", "M7b6 ^7b6"],
    [
        "1P 3M 5P 7M 11A",
        "major seventh sharp eleventh",
        "maj#4 Δ#4 Δ#11 M7#11 ^7#11 maj7#11",
    ],
    // ==Minor==
    // '''Normal'''
    ["1P 3m 5P", "minor", "m min -"],
    ["1P 3m 5P 7m", "minor seventh", "m7 min7 mi7 -7"],
    [
        "1P 3m 5P 7M",
        "minor/major seventh",
        "m/ma7 m/maj7 mM7 mMaj7 m/M7 -Δ7 mΔ -^7",
    ],
    ["1P 3m 5P 6M", "minor sixth", "m6 -6"],
    ["1P 3m 5P 7m 9M", "minor ninth", "m9 -9"],
    ["1P 3m 5P 7M 9M", "minor/major ninth", "mM9 mMaj9 -^9"],
    ["1P 3m 5P 7m 9M 11P", "minor eleventh", "m11 -11"],
    ["1P 3m 5P 7m 9M 13M", "minor thirteenth", "m13 -13"],
    // '''Diminished'''
    ["1P 3m 5d", "diminished", "dim ° o"],
    ["1P 3m 5d 7d", "diminished seventh", "dim7 °7 o7"],
    ["1P 3m 5d 7m", "half-diminished", "m7b5 ø -7b5 h7 h"],
    // ==Dominant/Seventh==
    // '''Normal'''
    ["1P 3M 5P 7m", "dominant seventh", "7 dom"],
    ["1P 3M 5P 7m 9M", "dominant ninth", "9"],
    ["1P 3M 5P 7m 9M 13M", "dominant thirteenth", "13"],
    ["1P 3M 5P 7m 11A", "lydian dominant seventh", "7#11 7#4"],
    // '''Altered'''
    ["1P 3M 5P 7m 9m", "dominant flat ninth", "7b9"],
    ["1P 3M 5P 7m 9A", "dominant sharp ninth", "7#9"],
    ["1P 3M 7m 9m", "altered", "alt7"],
    // '''Suspended'''
    ["1P 4P 5P", "suspended fourth", "sus4 sus"],
    ["1P 2M 5P", "suspended second", "sus2"],
    ["1P 4P 5P 7m", "suspended fourth seventh", "7sus4 7sus"],
    ["1P 5P 7m 9M 11P", "eleventh", "11"],
    [
        "1P 4P 5P 7m 9m",
        "suspended fourth flat ninth",
        "b9sus phryg 7b9sus 7b9sus4",
    ],
    // ==Other==
    ["1P 5P", "fifth", "5"],
    ["1P 3M 5A", "augmented", "aug + +5 ^#5"],
    ["1P 3m 5A", "minor augmented", "m#5 -#5 m+"],
    ["1P 3M 5A 7M", "augmented seventh", "maj7#5 maj7+5 +maj7 ^7#5"],
    [
        "1P 3M 5P 7M 9M 11A",
        "major sharp eleventh (lydian)",
        "maj9#11 Δ9#11 ^9#11",
    ],
    // ==Legacy==
    ["1P 2M 4P 5P", "", "sus24 sus4add9"],
    ["1P 3M 5A 7M 9M", "", "maj9#5 Maj9#5"],
    ["1P 3M 5A 7m", "", "7#5 +7 7+ 7aug aug7"],
    ["1P 3M 5A 7m 9A", "", "7#5#9 7#9#5 7alt"],
    ["1P 3M 5A 7m 9M", "", "9#5 9+"],
    ["1P 3M 5A 7m 9M 11A", "", "9#5#11"],
    ["1P 3M 5A 7m 9m", "", "7#5b9 7b9#5"],
    ["1P 3M 5A 7m 9m 11A", "", "7#5b9#11"],
    ["1P 3M 5A 9A", "", "+add#9"],
    ["1P 3M 5A 9M", "", "M#5add9 +add9"],
    ["1P 3M 5P 6M 11A", "", "M6#11 M6b5 6#11 6b5"],
    ["1P 3M 5P 6M 7M 9M", "", "M7add13"],
    ["1P 3M 5P 6M 9M 11A", "", "69#11"],
    ["1P 3m 5P 6M 9M", "", "m69 -69"],
    ["1P 3M 5P 6m 7m", "", "7b6"],
    ["1P 3M 5P 7M 9A 11A", "", "maj7#9#11"],
    ["1P 3M 5P 7M 9M 11A 13M", "", "M13#11 maj13#11 M13+4 M13#4"],
    ["1P 3M 5P 7M 9m", "", "M7b9"],
    ["1P 3M 5P 7m 11A 13m", "", "7#11b13 7b5b13"],
    ["1P 3M 5P 7m 13M", "", "7add6 67 7add13"],
    ["1P 3M 5P 7m 9A 11A", "", "7#9#11 7b5#9 7#9b5"],
    ["1P 3M 5P 7m 9A 11A 13M", "", "13#9#11"],
    ["1P 3M 5P 7m 9A 11A 13m", "", "7#9#11b13"],
    ["1P 3M 5P 7m 9A 13M", "", "13#9"],
    ["1P 3M 5P 7m 9A 13m", "", "7#9b13"],
    ["1P 3M 5P 7m 9M 11A", "", "9#11 9+4 9#4"],
    ["1P 3M 5P 7m 9M 11A 13M", "", "13#11 13+4 13#4"],
    ["1P 3M 5P 7m 9M 11A 13m", "", "9#11b13 9b5b13"],
    ["1P 3M 5P 7m 9m 11A", "", "7b9#11 7b5b9 7b9b5"],
    ["1P 3M 5P 7m 9m 11A 13M", "", "13b9#11"],
    ["1P 3M 5P 7m 9m 11A 13m", "", "7b9b13#11 7b9#11b13 7b5b9b13"],
    ["1P 3M 5P 7m 9m 13M", "", "13b9"],
    ["1P 3M 5P 7m 9m 13m", "", "7b9b13"],
    ["1P 3M 5P 7m 9m 9A", "", "7b9#9"],
    ["1P 3M 5P 9M", "", "Madd9 2 add9 add2"],
    ["1P 3M 5P 9m", "", "Maddb9"],
    ["1P 3M 5d", "", "Mb5"],
    ["1P 3M 5d 6M 7m 9M", "", "13b5"],
    ["1P 3M 5d 7M", "", "M7b5"],
    ["1P 3M 5d 7M 9M", "", "M9b5"],
    ["1P 3M 5d 7m", "", "7b5"],
    ["1P 3M 5d 7m 9M", "", "9b5"],
    ["1P 3M 7m", "", "7no5"],
    ["1P 3M 7m 13m", "", "7b13"],
    ["1P 3M 7m 9M", "", "9no5"],
    ["1P 3M 7m 9M 13M", "", "13no5"],
    ["1P 3M 7m 9M 13m", "", "9b13"],
    ["1P 3m 4P 5P", "", "madd4"],
    ["1P 3m 5P 6m 7M", "", "mMaj7b6"],
    ["1P 3m 5P 6m 7M 9M", "", "mMaj9b6"],
    ["1P 3m 5P 7m 11P", "", "m7add11 m7add4"],
    ["1P 3m 5P 9M", "", "madd9"],
    ["1P 3m 5d 6M 7M", "", "o7M7"],
    ["1P 3m 5d 7M", "", "oM7"],
    ["1P 3m 6m 7M", "", "mb6M7"],
    ["1P 3m 6m 7m", "", "m7#5"],
    ["1P 3m 6m 7m 9M", "", "m9#5"],
    ["1P 3m 5A 7m 9M 11P", "", "m11A"],
    ["1P 3m 6m 9m", "", "mb6b9"],
    ["1P 2M 3m 5d 7m", "", "m9b5"],
    ["1P 4P 5A 7M", "", "M7#5sus4"],
    ["1P 4P 5A 7M 9M", "", "M9#5sus4"],
    ["1P 4P 5A 7m", "", "7#5sus4"],
    ["1P 4P 5P 7M", "", "M7sus4"],
    ["1P 4P 5P 7M 9M", "", "M9sus4"],
    ["1P 4P 5P 7m 9M", "", "9sus4 9sus"],
    ["1P 4P 5P 7m 9M 13M", "", "13sus4 13sus"],
    ["1P 4P 5P 7m 9m 13m", "", "7sus4b9b13 7b9b13sus4"],
    ["1P 4P 7m 10m", "", "4 quartal"],
    ["1P 5P 7m 9m 11P", "", "11b9"],
];
let dictionary = [];
/**
 * Return a list of all chord types
 */
function all() {
    return dictionary.slice();
}
/**
 * Add a chord to the dictionary.
 * @param intervals
 * @param aliases
 * @param [fullName]
 */
function add(intervals, aliases, fullName) {
    const quality = getQuality(intervals);
    const chord = {
        ...get(intervals),
        name: fullName || "",
        quality,
        intervals,
        aliases,
    };
    dictionary.push(chord);
    chord.aliases.forEach((alias) => addAlias());
}
function addAlias(chord, alias) {
}
function getQuality(intervals) {
    const has = (interval) => intervals.indexOf(interval) !== -1;
    return has("5A")
        ? "Augmented"
        : has("3M")
            ? "Major"
            : has("5d")
                ? "Diminished"
                : has("3m")
                    ? "Minor"
                    : "Unknown";
}
CHORDS.forEach(([ivls, fullName, names]) => add(ivls.split(" "), names.split(" "), fullName));
dictionary.sort((a, b) => a.setNum - b.setNum);

// SCALES
// Format: ["intervals", "name", "alias1", "alias2", ...]
const SCALES = [
    // 5-note scales
    ["1P 2M 3M 5P 6M", "major pentatonic", "pentatonic"],
    ["1P 3M 4P 5P 7M", "ionian pentatonic"],
    ["1P 3M 4P 5P 7m", "mixolydian pentatonic", "indian"],
    ["1P 2M 4P 5P 6M", "ritusen"],
    ["1P 2M 4P 5P 7m", "egyptian"],
    ["1P 3M 4P 5d 7m", "neopolitan major pentatonic"],
    ["1P 3m 4P 5P 6m", "vietnamese 1"],
    ["1P 2m 3m 5P 6m", "pelog"],
    ["1P 2m 4P 5P 6m", "kumoijoshi"],
    ["1P 2M 3m 5P 6m", "hirajoshi"],
    ["1P 2m 4P 5d 7m", "iwato"],
    ["1P 2m 4P 5P 7m", "in-sen"],
    ["1P 3M 4A 5P 7M", "lydian pentatonic", "chinese"],
    ["1P 3m 4P 6m 7m", "malkos raga"],
    ["1P 3m 4P 5d 7m", "locrian pentatonic", "minor seven flat five pentatonic"],
    ["1P 3m 4P 5P 7m", "minor pentatonic", "vietnamese 2"],
    ["1P 3m 4P 5P 6M", "minor six pentatonic"],
    ["1P 2M 3m 5P 6M", "flat three pentatonic", "kumoi"],
    ["1P 2M 3M 5P 6m", "flat six pentatonic"],
    ["1P 2m 3M 5P 6M", "scriabin"],
    ["1P 3M 5d 6m 7m", "whole tone pentatonic"],
    ["1P 3M 4A 5A 7M", "lydian #5P pentatonic"],
    ["1P 3M 4A 5P 7m", "lydian dominant pentatonic"],
    ["1P 3m 4P 5P 7M", "minor #7M pentatonic"],
    ["1P 3m 4d 5d 7m", "super locrian pentatonic"],
    // 6-note scales
    ["1P 2M 3m 4P 5P 7M", "minor hexatonic"],
    ["1P 2A 3M 5P 5A 7M", "augmented"],
    ["1P 2M 3m 3M 5P 6M", "major blues"],
    ["1P 2M 4P 5P 6M 7m", "piongio"],
    ["1P 2m 3M 4A 6M 7m", "prometheus neopolitan"],
    ["1P 2M 3M 4A 6M 7m", "prometheus"],
    ["1P 2m 3M 5d 6m 7m", "mystery #1"],
    ["1P 2m 3M 4P 5A 6M", "six tone symmetric"],
    ["1P 2M 3M 4A 5A 7m", "whole tone", "messiaen's mode #1"],
    ["1P 2m 4P 4A 5P 7M", "messiaen's mode #5"],
    ["1P 3m 4P 5d 5P 7m", "minor blues", "blues"],
    // 7-note scales
    ["1P 2M 3M 4P 5d 6m 7m", "locrian major", "arabian"],
    ["1P 2m 3M 4A 5P 6m 7M", "double harmonic lydian"],
    ["1P 2M 3m 4P 5P 6m 7M", "harmonic minor"],
    [
        "1P 2m 2A 3M 4A 6m 7m",
        "altered",
        "super locrian",
        "diminished whole tone",
        "pomeroy",
    ],
    ["1P 2M 3m 4P 5d 6m 7m", "locrian #2", "half-diminished", "aeolian b5"],
    [
        "1P 2M 3M 4P 5P 6m 7m",
        "mixolydian b6",
        "melodic minor fifth mode",
        "hindu",
    ],
    ["1P 2M 3M 4A 5P 6M 7m", "lydian dominant", "lydian b7", "overtone"],
    ["1P 2M 3M 4A 5P 6M 7M", "lydian"],
    ["1P 2M 3M 4A 5A 6M 7M", "lydian augmented"],
    [
        "1P 2m 3m 4P 5P 6M 7m",
        "dorian b2",
        "phrygian #6",
        "melodic minor second mode",
    ],
    ["1P 2M 3m 4P 5P 6M 7M", "melodic minor"],
    ["1P 2m 3m 4P 5d 6m 7m", "locrian"],
    [
        "1P 2m 3m 4d 5d 6m 7d",
        "ultralocrian",
        "superlocrian bb7",
        "superlocrian diminished",
    ],
    ["1P 2m 3m 4P 5d 6M 7m", "locrian 6", "locrian natural 6", "locrian sharp 6"],
    ["1P 2A 3M 4P 5P 5A 7M", "augmented heptatonic"],
    // Source https://en.wikipedia.org/wiki/Ukrainian_Dorian_scale
    [
        "1P 2M 3m 4A 5P 6M 7m",
        "dorian #4",
        "ukrainian dorian",
        "romanian minor",
        "altered dorian",
    ],
    ["1P 2M 3m 4A 5P 6M 7M", "lydian diminished"],
    ["1P 2m 3m 4P 5P 6m 7m", "phrygian"],
    ["1P 2M 3M 4A 5A 7m 7M", "leading whole tone"],
    ["1P 2M 3M 4A 5P 6m 7m", "lydian minor"],
    ["1P 2m 3M 4P 5P 6m 7m", "phrygian dominant", "spanish", "phrygian major"],
    ["1P 2m 3m 4P 5P 6m 7M", "balinese"],
    ["1P 2m 3m 4P 5P 6M 7M", "neopolitan major"],
    ["1P 2M 3m 4P 5P 6m 7m", "aeolian", "minor"],
    ["1P 2M 3M 4P 5P 6m 7M", "harmonic major"],
    ["1P 2m 3M 4P 5P 6m 7M", "double harmonic major", "gypsy"],
    ["1P 2M 3m 4P 5P 6M 7m", "dorian"],
    ["1P 2M 3m 4A 5P 6m 7M", "hungarian minor"],
    ["1P 2A 3M 4A 5P 6M 7m", "hungarian major"],
    ["1P 2m 3M 4P 5d 6M 7m", "oriental"],
    ["1P 2m 3m 3M 4A 5P 7m", "flamenco"],
    ["1P 2m 3m 4A 5P 6m 7M", "todi raga"],
    ["1P 2M 3M 4P 5P 6M 7m", "mixolydian", "dominant"],
    ["1P 2m 3M 4P 5d 6m 7M", "persian"],
    ["1P 2M 3M 4P 5P 6M 7M", "major", "ionian"],
    ["1P 2m 3M 5d 6m 7m 7M", "enigmatic"],
    [
        "1P 2M 3M 4P 5A 6M 7M",
        "major augmented",
        "major #5",
        "ionian augmented",
        "ionian #5",
    ],
    ["1P 2A 3M 4A 5P 6M 7M", "lydian #9"],
    // 8-note scales
    ["1P 2m 2M 4P 4A 5P 6m 7M", "messiaen's mode #4"],
    ["1P 2m 3M 4P 4A 5P 6m 7M", "purvi raga"],
    ["1P 2m 3m 3M 4P 5P 6m 7m", "spanish heptatonic"],
    ["1P 2M 3M 4P 5P 6M 7m 7M", "bebop"],
    ["1P 2M 3m 3M 4P 5P 6M 7m", "bebop minor"],
    ["1P 2M 3M 4P 5P 5A 6M 7M", "bebop major"],
    ["1P 2m 3m 4P 5d 5P 6m 7m", "bebop locrian"],
    ["1P 2M 3m 4P 5P 6m 7m 7M", "minor bebop"],
    ["1P 2M 3m 4P 5d 6m 6M 7M", "diminished", "whole-half diminished"],
    ["1P 2M 3M 4P 5d 5P 6M 7M", "ichikosucho"],
    ["1P 2M 3m 4P 5P 6m 6M 7M", "minor six diminished"],
    [
        "1P 2m 3m 3M 4A 5P 6M 7m",
        "half-whole diminished",
        "dominant diminished",
        "messiaen's mode #2",
    ],
    ["1P 3m 3M 4P 5P 6M 7m 7M", "kafi raga"],
    ["1P 2M 3M 4P 4A 5A 6A 7M", "messiaen's mode #6"],
    // 9-note scales
    ["1P 2M 3m 3M 4P 5d 5P 6M 7m", "composite blues"],
    ["1P 2M 3m 3M 4A 5P 6m 7m 7M", "messiaen's mode #3"],
    // 10-note scales
    ["1P 2m 2M 3m 4P 4A 5P 6m 6M 7M", "messiaen's mode #7"],
    // 12-note scales
    ["1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M", "chromatic"],
];

const NoScaleType = {
    ...EmptyPcset,
    intervals: [],
    aliases: [],
};
let dictionary$1 = [];
let index = {};
function names() {
    return dictionary$1.map((scale) => scale.name);
}
/**
 * Given a scale name or chroma, return the scale properties
 *
 * @param {string} type - scale name or pitch class set chroma
 * @example
 * import { get } from 'tonaljs/scale-type'
 * get('major') // => { name: 'major', ... }
 */
function get$1(type) {
    return index[type] || NoScaleType;
}
/**
 * Return a list of all scale types
 */
function all$1() {
    return dictionary$1.slice();
}
/**
 * Add a scale into dictionary
 * @param intervals
 * @param name
 * @param aliases
 */
function add$1(intervals, name, aliases = []) {
    const scale = { ...get(intervals), name, intervals, aliases };
    dictionary$1.push(scale);
    index[scale.name] = scale;
    index[scale.setNum] = scale;
    index[scale.chroma] = scale;
    scale.aliases.forEach((alias) => addAlias$1(scale, alias));
    return scale;
}
function addAlias$1(scale, alias) {
    index[alias] = scale;
}
SCALES.forEach(([ivls, name, ...aliases]) => add$1(ivls.split(" "), name, aliases));

/**
 * Get the natural list of names
 */
function names$1() {
    return "1P 2M 3M 4P 5P 6m 7m".split(" ");
}
/**
 * Get properties of an interval
 *
 * @function
 * @example
 * Interval.get('P4') // => {"alt": 0,  "dir": 1,  "name": "4P", "num": 4, "oct": 0, "q": "P", "semitones": 5, "simple": 4, "step": 3, "type": "perfectable"}
 */
const get$2 = interval;
/**
 * Get name of an interval
 *
 * @function
 * @example
 * Interval.name('4P') // => "4P"
 * Interval.name('P4') // => "4P"
 * Interval.name('C4') // => ""
 */
const name = (name) => interval(name).name;
/**
 * Get semitones of an interval
 * @function
 * @example
 * Interval.semitones('P4') // => 5
 */
const semitones = (name) => interval(name).semitones;
/**
 * Get quality of an interval
 * @function
 * @example
 * Interval.quality('P4') // => "P"
 */
const quality = (name) => interval(name).q;
/**
 * Get number of an interval
 * @function
 * @example
 * Interval.num('P4') // => 4
 */
const num = (name) => interval(name).num;
/**
 * Get the simplified version of an interval.
 *
 * @function
 * @param {string} interval - the interval to simplify
 * @return {string} the simplified interval
 *
 * @example
 * Interval.simplify("9M") // => "2M"
 * Interval.simplify("2M") // => "2M"
 * Interval.simplify("-2M") // => "7m"
 * ["8P", "9M", "10M", "11P", "12P", "13M", "14M", "15P"].map(Interval.simplify)
 * // => [ "8P", "2M", "3M", "4P", "5P", "6M", "7M", "8P" ]
 */
function simplify(name) {
    const i = interval(name);
    return i.empty ? "" : i.simple + i.q;
}
/**
 * Get the inversion (https://en.wikipedia.org/wiki/Inversion_(music)#Intervals)
 * of an interval.
 *
 * @function
 * @param {string} interval - the interval to invert in interval shorthand
 * notation or interval array notation
 * @return {string} the inverted interval
 *
 * @example
 * Interval.invert("3m") // => "6M"
 * Interval.invert("2M") // => "7m"
 */
function invert(name) {
    const i = interval(name);
    if (i.empty) {
        return "";
    }
    const step = (7 - i.step) % 7;
    const alt = i.type === "perfectable" ? -i.alt : -(i.alt + 1);
    return interval({ step, alt, oct: i.oct, dir: i.dir }).name;
}
// interval numbers
const IN = [1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7];
// interval qualities
const IQ = "P m M m M P d P m M m M".split(" ");
/**
 * Get interval name from semitones number. Since there are several interval
 * names for the same number, the name it's arbitrary, but deterministic.
 *
 * @param {Integer} num - the number of semitones (can be negative)
 * @return {string} the interval name
 * @example
 * Interval.fromSemitones(7) // => "5P"
 * Interval.fromSemitones(-7) // => "-5P"
 */
function fromSemitones(semitones) {
    const d = semitones < 0 ? -1 : 1;
    const n = Math.abs(semitones);
    const c = n % 12;
    const o = Math.floor(n / 12);
    return d * (IN[c] + 7 * o) + IQ[c];
}
/**
 * Find interval between two notes
 *
 * @example
 * Interval.distance("C4", "G4"); // => "5P"
 */
const distance$1 = distance;
/**
 * Adds two intervals
 *
 * @function
 * @param {string} interval1
 * @param {string} interval2
 * @return {string} the added interval name
 * @example
 * Interval.add("3m", "5P") // => "7m"
 */
const add$2 = combinator((a, b) => [a[0] + b[0], a[1] + b[1]]);
/**
 * Returns a function that adds an interval
 *
 * @function
 * @example
 * ['1P', '2M', '3M'].map(Interval.addTo('5P')) // => ["5P", "6M", "7M"]
 */
const addTo = (interval) => (other) => add$2(interval, other);
/**
 * Subtracts two intervals
 *
 * @function
 * @param {string} minuendInterval
 * @param {string} subtrahendInterval
 * @return {string} the substracted interval name
 * @example
 * Interval.substract('5P', '3M') // => '3m'
 * Interval.substract('3M', '5P') // => '-3m'
 */
const substract = combinator((a, b) => [a[0] - b[0], a[1] - b[1]]);
function transposeFifths(interval, fifths) {
    const ivl = get$2(interval);
    if (ivl.empty)
        return "";
    const [nFifths, nOcts, dir] = ivl.coord;
    return coordToInterval([nFifths + fifths, nOcts, dir]).name;
}
var index$1 = {
    names: names$1,
    get: get$2,
    name,
    num,
    semitones,
    quality,
    fromSemitones,
    distance: distance$1,
    invert,
    simplify,
    add: add$2,
    addTo,
    substract,
    transposeFifths,
};
function combinator(fn) {
    return (a, b) => {
        const coordA = interval(a).coord;
        const coordB = interval(b).coord;
        if (coordA && coordB) {
            const coord = fn(coordA, coordB);
            return coordToInterval(coord).name;
        }
    };
}

const L2 = Math.log(2);
const L440 = Math.log(440);
/**
 * Get the midi number from a frequency in hertz. The midi number can
 * contain decimals (with two digits precission)
 *
 * @param {number} frequency
 * @return {number}
 * @example
 * import { freqToMidi} from '@tonaljs/midi'
 * freqToMidi(220)); //=> 57
 * freqToMidi(261.62)); //=> 60
 * freqToMidi(261)); //=> 59.96
 */
function freqToMidi(freq) {
    const v = (12 * (Math.log(freq) - L440)) / L2 + 69;
    return Math.round(v * 100) / 100;
}
const SHARPS = "C C# D D# E F F# G G# A A# B".split(" ");
const FLATS = "C Db D Eb E F Gb G Ab A Bb B".split(" ");
/**
 * Given a midi number, returns a note name. The altered notes will have
 * flats unless explicitly set with the optional `useSharps` parameter.
 *
 * @function
 * @param {number} midi - the midi note number
 * @param {Object} options = default: `{ sharps: false, pitchClass: false }`
 * @param {boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {string} the note name
 * @example
 * import { midiToNoteName } from '@tonaljs/midi'
 * midiToNoteName(61) // => "Db4"
 * midiToNoteName(61, { pitchClass: true }) // => "Db"
 * midiToNoteName(61, { sharps: true }) // => "C#4"
 * midiToNoteName(61, { pitchClass: true, sharps: true }) // => "C#"
 * // it rounds to nearest note
 * midiToNoteName(61.7) // => "D4"
 */
function midiToNoteName(midi, options = {}) {
    if (isNaN(midi) || midi === -Infinity || midi === Infinity)
        return "";
    midi = Math.round(midi);
    const pcs = options.sharps === true ? SHARPS : FLATS;
    const pc = pcs[midi % 12];
    if (options.pitchClass) {
        return pc;
    }
    const o = Math.floor(midi / 12) - 1;
    return pc + o;
}

const NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const toName = (n) => n.name;
const onlyNotes = (array) => array.map(note).filter((n) => !n.empty);
/**
 * Return the natural note names without octave
 * @function
 * @example
 * Note.names(); // => ["C", "D", "E", "F", "G", "A", "B"]
 */
function names$2(array) {
    if (array === undefined) {
        return NAMES.slice();
    }
    else if (!Array.isArray(array)) {
        return [];
    }
    else {
        return onlyNotes(array).map(toName);
    }
}
/**
 * Get a note from a note name
 *
 * @function
 * @example
 * Note.get('Bb4') // => { name: "Bb4", midi: 70, chroma: 10, ... }
 */
const get$3 = note;
/**
 * Get the note name
 * @function
 */
const name$1 = (note) => get$3(note).name;
/**
 * Get the note pitch class name
 * @function
 */
const pitchClass = (note) => get$3(note).pc;
/**
 * Get the note accidentals
 * @function
 */
const accidentals = (note) => get$3(note).acc;
/**
 * Get the note octave
 * @function
 */
const octave = (note) => get$3(note).oct;
/**
 * Get the note midi
 * @function
 */
const midi = (note) => get$3(note).midi;
/**
 * Get the note midi
 * @function
 */
const freq = (note) => get$3(note).freq;
/**
 * Get the note chroma
 * @function
 */
const chroma = (note) => get$3(note).chroma;
/**
 * Given a midi number, returns a note name. Uses flats for altered notes.
 *
 * @function
 * @param {number} midi - the midi note number
 * @return {string} the note name
 * @example
 * Note.fromMidi(61) // => "Db4"
 * Note.fromMidi(61.7) // => "D4"
 */
function fromMidi(midi) {
    return midiToNoteName(midi);
}
/**
 * Given a midi number, returns a note name. Uses flats for altered notes.
 */
function fromFreq(freq) {
    return midiToNoteName(freqToMidi(freq));
}
/**
 * Given a midi number, returns a note name. Uses flats for altered notes.
 */
function fromFreqSharps(freq) {
    return midiToNoteName(freqToMidi(freq), { sharps: true });
}
/**
 * Given a midi number, returns a note name. Uses flats for altered notes.
 *
 * @function
 * @param {number} midi - the midi note number
 * @return {string} the note name
 * @example
 * Note.fromMidiSharps(61) // => "C#4"
 */
function fromMidiSharps(midi) {
    return midiToNoteName(midi, { sharps: true });
}
/**
 * Transpose a note by an interval
 */
const transpose$1 = transpose;
const tr = transpose;
/**
 * Transpose by an interval.
 * @function
 * @param {string} interval
 * @return {function} a function that transposes by the given interval
 * @example
 * ["C", "D", "E"].map(Note.transposeBy("5P"));
 * // => ["G", "A", "B"]
 */
const transposeBy = (interval) => (note) => transpose$1(note, interval);
const trBy = transposeBy;
/**
 * Transpose from a note
 * @function
 * @param {string} note
 * @return {function}  a function that transposes the the note by an interval
 * ["1P", "3M", "5P"].map(Note.transposeFrom("C"));
 * // => ["C", "E", "G"]
 */
const transposeFrom = (note) => (interval) => transpose$1(note, interval);
const trFrom = transposeFrom;
/**
 * Transpose a note by a number of perfect fifths.
 *
 * @function
 * @param {string} note - the note name
 * @param {number} fifhts - the number of fifths
 * @return {string} the transposed note name
 *
 * @example
 * import { transposeFifths } from "@tonaljs/note"
 * transposeFifths("G4", 1) // => "D"
 * [0, 1, 2, 3, 4].map(fifths => transposeFifths("C", fifths)) // => ["C", "G", "D", "A", "E"]
 */
function transposeFifths$1(noteName, fifths) {
    const note = get$3(noteName);
    if (note.empty) {
        return "";
    }
    const [nFifths, nOcts] = note.coord;
    const transposed = nOcts === undefined
        ? coordToNote([nFifths + fifths])
        : coordToNote([nFifths + fifths, nOcts]);
    return transposed.name;
}
const trFifths = transposeFifths$1;
const ascending = (a, b) => a.height - b.height;
const descending = (a, b) => b.height - a.height;
function sortedNames(notes, comparator) {
    comparator = comparator || ascending;
    return onlyNotes(notes).sort(comparator).map(toName);
}
function sortedUniqNames(notes) {
    return sortedNames(notes, ascending).filter((n, i, a) => i === 0 || n !== a[i - 1]);
}
/**
 * Simplify a note
 *
 * @function
 * @param {string} note - the note to be simplified
 * - sameAccType: default true. Use same kind of accidentals that source
 * @return {string} the simplified note or '' if not valid note
 * @example
 * simplify("C##") // => "D"
 * simplify("C###") // => "D#"
 * simplify("C###")
 * simplify("B#4") // => "C5"
 */
const simplify$1 = (noteName) => {
    const note = get$3(noteName);
    if (note.empty) {
        return "";
    }
    return midiToNoteName(note.midi || note.chroma, {
        sharps: note.alt > 0,
        pitchClass: note.midi === null,
    });
};
/**
 * Get enharmonic of a note
 *
 * @function
 * @param {string} note
 * @param [string] - [optional] Destination pitch class
 * @return {string} the enharmonic note name or '' if not valid note
 * @example
 * Note.enharmonic("Db") // => "C#"
 * Note.enharmonic("C") // => "C"
 * Note.enharmonic("F2","E#") // => "E#2"
 */
function enharmonic(noteName, destName) {
    const src = get$3(noteName);
    if (src.empty) {
        return "";
    }
    // destination: use given or generate one
    const dest = get$3(destName ||
        midiToNoteName(src.midi || src.chroma, {
            sharps: src.alt < 0,
            pitchClass: true,
        }));
    // ensure destination is valid
    if (dest.empty || dest.chroma !== src.chroma) {
        return "";
    }
    // if src has no octave, no need to calculate anything else
    if (src.oct === undefined) {
        return dest.pc;
    }
    // detect any octave overflow
    const srcChroma = src.chroma - src.alt;
    const destChroma = dest.chroma - dest.alt;
    const destOctOffset = srcChroma > 11 || destChroma < 0
        ? -1
        : srcChroma < 0 || destChroma > 11
            ? +1
            : 0;
    // calculate the new octave
    const destOct = src.oct + destOctOffset;
    return dest.pc + destOct;
}
var index$2 = {
    names: names$2,
    get: get$3,
    name: name$1,
    pitchClass,
    accidentals,
    octave,
    midi,
    ascending,
    descending,
    sortedNames,
    sortedUniqNames,
    fromMidi,
    fromMidiSharps,
    freq,
    fromFreq,
    fromFreqSharps,
    chroma,
    transpose: transpose$1,
    tr,
    transposeBy,
    trBy,
    transposeFrom,
    trFrom,
    transposeFifths: transposeFifths$1,
    trFifths,
    simplify: simplify$1,
    enharmonic,
};

const Empty = Object.freeze([]);

const MODES = [
    [0, 2773, 0, "ionian", "", "Maj7", "major"],
    [1, 2902, 2, "dorian", "m", "m7"],
    [2, 3418, 4, "phrygian", "m", "m7"],
    [3, 2741, -1, "lydian", "", "Maj7"],
    [4, 2774, 1, "mixolydian", "", "7"],
    [5, 2906, 3, "aeolian", "m", "m7", "minor"],
    [6, 3434, 5, "locrian", "dim", "m7b5"],
];
const NoMode = {
    ...EmptyPcset,
    name: "",
    alt: 0,
    modeNum: NaN,
    triad: "",
    seventh: "",
    aliases: [],
};
const modes$1 = MODES.map(toMode);
const index$3 = {};
modes$1.forEach((mode) => {
    index$3[mode.name] = mode;
    mode.aliases.forEach((alias) => {
        index$3[alias] = mode;
    });
});
/**
 * Get a Mode by it's name
 *
 * @example
 * get('dorian')
 * // =>
 * // {
 * //   intervals: [ '1P', '2M', '3m', '4P', '5P', '6M', '7m' ],
 * //   modeNum: 1,
 * //   chroma: '101101010110',
 * //   normalized: '101101010110',
 * //   name: 'dorian',
 * //   setNum: 2902,
 * //   alt: 2,
 * //   triad: 'm',
 * //   seventh: 'm7',
 * //   aliases: []
 * // }
 */
function get$4(name) {
    return typeof name === "string"
        ? index$3[name.toLowerCase()] || NoMode
        : name && name.name
            ? get$4(name.name)
            : NoMode;
}
function toMode(mode) {
    const [modeNum, setNum, alt, name, triad, seventh, alias] = mode;
    const aliases = alias ? [alias] : [];
    const chroma = Number(setNum).toString(2);
    const intervals = get$1(name).intervals;
    return {
        empty: false,
        intervals,
        modeNum,
        chroma,
        normalized: chroma,
        name,
        setNum,
        alt,
        triad,
        seventh,
        aliases,
    };
}
function chords(chords) {
    return (modeName, tonic) => {
        const mode = get$4(modeName);
        if (mode.empty)
            return [];
        const triads = rotate(mode.modeNum, chords);
        const tonics = mode.intervals.map((i) => transpose(tonic, i));
        return triads.map((triad, i) => tonics[i] + triad);
    };
}
const triads = chords(MODES.map((x) => x[4]));
const seventhChords = chords(MODES.map((x) => x[5]));

/**
 * References:
 * - https://www.researchgate.net/publication/327567188_An_Algorithm_for_Spelling_the_Pitches_of_Any_Musical_Scale
 * @module scale
 */
const NoScale = {
    empty: true,
    name: "",
    type: "",
    tonic: null,
    setNum: NaN,
    chroma: "",
    normalized: "",
    aliases: [],
    notes: [],
    intervals: [],
};
/**
 * Given a string with a scale name and (optionally) a tonic, split
 * that components.
 *
 * It retuns an array with the form [ name, tonic ] where tonic can be a
 * note name or null and name can be any arbitrary string
 * (this function doesn"t check if that scale name exists)
 *
 * @function
 * @param {string} name - the scale name
 * @return {Array} an array [tonic, name]
 * @example
 * tokenize("C mixolydean") // => ["C", "mixolydean"]
 * tokenize("anything is valid") // => ["", "anything is valid"]
 * tokenize() // => ["", ""]
 */
function tokenize(name) {
    if (typeof name !== "string") {
        return ["", ""];
    }
    const i = name.indexOf(" ");
    const tonic = note(name.substring(0, i));
    if (tonic.empty) {
        const n = note(name);
        return n.empty ? ["", name] : [n.name, ""];
    }
    const type = name.substring(tonic.name.length + 1);
    return [tonic.name, type.length ? type : ""];
}
/**
 * Get all scale names
 * @function
 */
const names$3 = names;
/**
 * Get a Scale from a scale name.
 */
function get$5(src) {
    const tokens = Array.isArray(src) ? src : tokenize(src);
    const tonic = note(tokens[0]).name;
    const st = get$1(tokens[1]);
    if (st.empty) {
        return NoScale;
    }
    const type = st.name;
    const notes = tonic
        ? st.intervals.map((i) => transpose(tonic, i))
        : [];
    const name = tonic ? tonic + " " + type : type;
    return { ...st, name, type, tonic, notes };
}
const scale = deprecate("Scale.scale", "Scale.get", get$5);
/**
 * Get all chords that fits a given scale
 *
 * @function
 * @param {string} name - the scale name
 * @return {Array<string>} - the chord names
 *
 * @example
 * scaleChords("pentatonic") // => ["5", "64", "M", "M6", "Madd9", "Msus2"]
 */
function scaleChords(name) {
    const s = get$5(name);
    const inScale = isSubsetOf(s.chroma);
    return all()
        .filter((chord) => inScale(chord.chroma))
        .map((chord) => chord.aliases[0]);
}
/**
 * Get all scales names that are a superset of the given one
 * (has the same notes and at least one more)
 *
 * @function
 * @param {string} name
 * @return {Array} a list of scale names
 * @example
 * extended("major") // => ["bebop", "bebop dominant", "bebop major", "chromatic", "ichikosucho"]
 */
function extended(name) {
    const s = get$5(name);
    const isSuperset = isSupersetOf(s.chroma);
    return all$1()
        .filter((scale) => isSuperset(scale.chroma))
        .map((scale) => scale.name);
}
/**
 * Find all scales names that are a subset of the given one
 * (has less notes but all from the given scale)
 *
 * @function
 * @param {string} name
 * @return {Array} a list of scale names
 *
 * @example
 * reduced("major") // => ["ionian pentatonic", "major pentatonic", "ritusen"]
 */
function reduced(name) {
    const isSubset = isSubsetOf(get$5(name).chroma);
    return all$1()
        .filter((scale) => isSubset(scale.chroma))
        .map((scale) => scale.name);
}
/**
 * Given an array of notes, return the scale: a pitch class set starting from
 * the first note of the array
 *
 * @function
 * @param {string[]} notes
 * @return {string[]} pitch classes with same tonic
 * @example
 * scaleNotes(['C4', 'c3', 'C5', 'C4', 'c4']) // => ["C"]
 * scaleNotes(['D4', 'c#5', 'A5', 'F#6']) // => ["D", "F#", "A", "C#"]
 */
function scaleNotes(notes) {
    const pcset = notes.map((n) => note(n).pc).filter((x) => x);
    const tonic = pcset[0];
    const scale = sortedUniqNames(pcset);
    return rotate(scale.indexOf(tonic), scale);
}
/**
 * Find mode names of a scale
 *
 * @function
 * @param {string} name - scale name
 * @example
 * modeNames("C pentatonic") // => [
 *   ["C", "major pentatonic"],
 *   ["D", "egyptian"],
 *   ["E", "malkos raga"],
 *   ["G", "ritusen"],
 *   ["A", "minor pentatonic"]
 * ]
 */
function modeNames(name) {
    const s = get$5(name);
    if (s.empty) {
        return [];
    }
    const tonics = s.tonic ? s.notes : s.intervals;
    return modes(s.chroma)
        .map((chroma, i) => {
        const modeName = get$5(chroma).name;
        return modeName ? [tonics[i], modeName] : ["", ""];
    })
        .filter((x) => x[0]);
}
function getNoteNameOf(scale) {
    const names = Array.isArray(scale) ? scaleNotes(scale) : get$5(scale).notes;
    const chromas = names.map((name) => note(name).chroma);
    return (noteOrMidi) => {
        const currNote = typeof noteOrMidi === "number"
            ? note(fromMidi(noteOrMidi))
            : note(noteOrMidi);
        const height = currNote.height;
        if (height === undefined)
            return undefined;
        const chroma = height % 12;
        const position = chromas.indexOf(chroma);
        if (position === -1)
            return undefined;
        return enharmonic(currNote.name, names[position]);
    };
}
function rangeOf(scale) {
    const getName = getNoteNameOf(scale);
    return (fromNote, toNote) => {
        const from = note(fromNote).height;
        const to = note(toNote).height;
        if (from === undefined || to === undefined)
            return [];
        return range(from, to)
            .map(getName)
            .filter((x) => x);
    };
}
var index$4 = {
    get: get$5,
    names: names$3,
    extended,
    modeNames,
    reduced,
    scaleChords,
    scaleNotes,
    tokenize,
    rangeOf,
    // deprecated
    scale,
};

export { index$1 as Interval, index$2 as Note, index$4 as Scale };
