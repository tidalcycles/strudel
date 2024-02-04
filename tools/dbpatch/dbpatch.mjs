import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { stringify } from 'csv-stringify/sync';

const hasCpsCall = (code) =>
  ['setcps', 'setCps', 'setCpm', 'setcpm'].reduce((acc, m) => acc || code.includes(`${m}`), false);

function withCps(code, cps) {
  if (hasCpsCall(code)) {
    return code;
  }
  const lines = code.split('\n');
  const firstNonLineComment = lines.findIndex((l) => !l.startsWith('//'));
  const cpsCall = `setcps(${cps})`;
  lines.splice(firstNonLineComment, 0, cpsCall);
  return lines.join('\n');
}

const dumpNew = readFileSync('./code_rows.csv', { encoding: 'utf-8' });

const records = parse(dumpNew, {
  columns: true,
  skip_empty_lines: true,
});

const edited = records.map((entry) => ({
  ...entry,
  code: withCps(entry.code, 1),
}));

console.log(stringify(edited));
