// this script will render all example tunes and log them to the console.
// it is intended to be written to tunes.snapshot.mjs using `npm run snapshot`

import * as tunes from '../tunes.mjs';
import { queryCode } from './runtime.mjs';

Object.entries(tunes).forEach(([key, code]) => {
  queryCode(code, 1).then((haps) => {
    console.log(`export const ${key} = ${JSON.stringify(haps, null, 1)}`);
  });
});
