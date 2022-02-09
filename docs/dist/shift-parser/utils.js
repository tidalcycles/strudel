/**
 * Copyright 2017 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { whitespaceArray, whitespaceBool, idStartLargeRegex, idStartBool, idContinueLargeRegex, idContinueBool } from './unicode.js';


const strictReservedWords = [
  'null',
  'true',
  'false',

  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'let',

  'if',
  'in',
  'do',
  'var',
  'for',
  'new',
  'try',
  'this',
  'else',
  'case',
  'void',
  'with',
  'enum',
  'while',
  'break',
  'catch',
  'throw',
  'const',
  'yield',
  'class',
  'super',
  'return',
  'typeof',
  'delete',
  'switch',
  'export',
  'import',
  'default',
  'finally',
  'extends',
  'function',
  'continue',
  'debugger',
  'instanceof',
];

export function isStrictModeReservedWord(id) {
  return strictReservedWords.indexOf(id) !== -1;
}

export function isWhiteSpace(ch) {
  return ch < 128 ? whitespaceBool[ch] : ch === 0xA0 || ch > 0x167F && whitespaceArray.indexOf(ch) !== -1;
}

export function isLineTerminator(ch) {
  return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
}

export function isIdentifierStart(ch) {
  return ch < 128 ? idStartBool[ch] : idStartLargeRegex.test(String.fromCodePoint(ch));
}

export function isIdentifierPart(ch) {
  return ch < 128 ? idContinueBool[ch] : idContinueLargeRegex.test(String.fromCodePoint(ch));
}

export function isDecimalDigit(ch) {
  return ch >= 48 && ch <= 57;
}

export function getHexValue(rune) {
  if (rune >= '0' && rune <= '9') {
    return rune.charCodeAt(0) - 48;
  }
  if (rune >= 'a' && rune <= 'f') {
    return rune.charCodeAt(0) - 87;
  }
  if (rune >= 'A' && rune <= 'F') {
    return rune.charCodeAt(0) - 55;
  }
  return -1;
}
