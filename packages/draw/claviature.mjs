import { Pattern, noteToMidi } from '@strudel/core';

const blackPattern = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];

export const tokenizeNote = (note) => {
  if (typeof note !== 'string') {
    return [];
  }
  const [pc, acc = '', oct] = note.match(/^([a-gA-G])([#bs]*)([0-9])?$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct ? Number(oct) : undefined];
};
const accs = { '#': 1, b: -1, s: 1 };
const toMidi = (note) => {
  if (typeof note === 'number') {
    return note;
  }
  const [pc, acc, oct] = tokenizeNote(note);
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[pc.toLowerCase()];
  const offset = acc?.split('').reduce((o, char) => o + accs[char], 0) || 0;
  return (Number(oct) + 1) * 12 + chroma + offset;
};

const getMidiKeys = (range, offset) => {
  const white /* : number[] */ = [];
  const black /* : number[] */ = [];
  const to = noteToMidi(range[1]);
  for (let i = offset; i <= to; i++) {
    //
    (blackPattern[i % 12] ? black : white).push(i);
  }
  return [white, black];
};

const whiteWidth = (midi, topWidth) => (midi % 12 > 4 ? 7 / 4 : 5 / 3) * topWidth;

const whiteX = (midi, offset, topWidth) =>
  Array.from({ length: midi - offset }, (_, i) => i + offset).reduce(
    (sum, m) => (!blackPattern[m % 12] ? sum + whiteWidth(m, topWidth) : sum),
    0,
  ); // TODO: calculate mathematically

/* const blackX = (index, offset, topWidth) => {
  const cDiff = 12 - (offset % 12);
  console.log('cDiff', cDiff);
  const cOffset = whiteX(cDiff + offset);
  const blackOffset = cOffset + cDiff * topWidth;
  return (index - offset) * topWidth + blackOffset;
}; */

const parseNote = (note) => (typeof note === 'number' ? note : toMidi(note));

export function claviature(haps, options) {
  const {
    ctx = getDrawContext(),
    range = ['A1', 'C6'],
    scaleX = 1,
    scaleY = 1,
    palette = [getTheme().foreground, getTheme().background],
    strokeWidth = 0,
    stroke = getTheme().foreground,
    upperWidth = 14,
    upperHeight = 100,
    lowerHeight = 45,
  } = options || {};
  const offset = parseNote(range[0]);
  const colorize = haps.map((hap) => ({ keys: [hap.value.note], color: hap.value.color || getTheme().selection }));
  /* const to = parseNote(range[1]);
  const totalKeys = to - offset + 1; */
  /* const width = totalKeys * topWidth + topWidth + strokeWidth * 2;
    const height = whiteHeight; */

  const topWidth = upperWidth * scaleX;
  const [white, black] = getMidiKeys(range, offset);

  const whiteHeight = (upperHeight + lowerHeight) * scaleY;
  const blackHeight = upperHeight * scaleY;

  const cDiff = 12 - (offset % 12);
  const cOffset = whiteX(cDiff + offset);
  const blackOffset = cOffset - cDiff * topWidth;

  const blackX = (index) => (index - offset) * topWidth + blackOffset;

  const colorizedMidi = colorize.map((c) => ({
    ...c,
    keys: c.keys.map((key) => parseNote(key)),
  }));
  const getColor = (midi) => colorizedMidi.find(({ keys }) => keys.includes(midi))?.color;
  ctx.clearRect(0, 0, ctx.canvas.width * 2, ctx.canvas.height * 2);
  ctx.strokeStyle = stroke;
  ctx.strokeWidth = strokeWidth;
  white.forEach((midi) => {
    ctx.fillStyle = getColor(midi) ?? palette[1];
    const x = whiteX(midi, offset, topWidth);
    const width = whiteWidth(midi, topWidth);
    ctx.fillRect(x, 0, width, whiteHeight);
    ctx.strokeRect(x, 0, width, whiteHeight);
  });
  black.forEach((midi) => {
    ctx.fillStyle = getColor(midi) ?? palette[0];
    const x = blackX(midi, offset, topWidth);
    //ctx.strokeRect(x, 0, topWidth, blackHeight);
    ctx.fillRect(x, 0, topWidth, blackHeight);
  });
}

Pattern.prototype.claviature = function (options) {
  return this.draw((haps) => claviature(haps, options), { id: options.id });
};
