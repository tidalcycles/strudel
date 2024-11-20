/*
mini.mjs - <short description TODO>
Copyright (C) 2024 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/mini.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as strudel from '@strudel/core';

// "parser"
let token_types = {
  open_polyrhythm: /^\[/,
  close_polyrhythm: /^\]/,
  open_polymeter: /^\{/,
  close_polymeter: /^\}/,
  open_slowpolymeter: /^\</,
  close_slowpolymeter: /^\>/,
  subpat_delimiter: /^,/,
  fast: /^\*/,
  slow: /^\//,
  // is there a better way without back-tracking for whole numbers?
  // float: /^(\d*\.)?\d+/,
  plain: /^[a-zA-Z0-9\.\#]+/,
};

let token_offset;
function next_token(code, global_offset) {
  for (let type in token_types) {
    const match = code.match(token_types[type]);
    if (match) {
      const leftpad = match[0].length - match[0].trimLeft().length;
      const rightpad = match[0].length - match[0].trimRight().length;
      const result = {
        type,
        value: match[0],
        location: [token_offset + leftpad + global_offset, token_offset + match[0].length + global_offset - rightpad],
      };
      token_offset += match[0].length;
      return result;
    }
  }
  throw new Error('could not match "' + code + '"');
}

function tokenize(code, global_offset) {
  let tokens = [];
  token_offset = 0;
  while (code.length > 0) {
    const trimmed = code.trim();
    token_offset += code.length - trimmed.length;
    code = trimmed;
    const token = next_token(code, global_offset);
    code = code.slice(token.value.length);
    tokens.push(token);
  }
  return tokens;
}

class Parser {
  parse(code, global_offset) {
    this.tokens = tokenize(code, global_offset);
    const subpats = this.parse_subpats();
    return { type: 'polymeter', subpats };
  }
  consume(type) {
    const token = this.tokens.shift();
    this.offset += token.length;
    if (token.type !== type) {
      throw new Error('expected token type ' + type + ' got ' + token.type);
    }
    return token;
  }
  parse_step() {
    let next = this.tokens[0]?.type;
    if (next === 'open_polyrhythm') {
      return this.parse_polyrhythm();
    }
    if (next === 'open_polymeter') {
      return this.parse_polymeter();
    }
    if (next === 'open_slowpolymeter') {
      return this.parse_slowpolymeter();
    }
    if (next === 'plain') {
      return this.consume('plain');
    }
    throw new Error('unexpected token ' + this.tokens[0]?.value + ' of type ' + this.tokens[0]?.type);
  }
  parse_expr() {
    let result = this.parse_step();
    let looking = true;
    while (looking) {
      let next = this.tokens[0]?.type;
      if (!next) {
        looking = false;
      } else {
        switch (next) {
          case 'fast':
          case 'slow':
            this.consume(next);
            const factor = this.parse_step();
            result = { type: next, factor, step: result };
            break;
          default:
            looking = false;
        }
      }
    }
    return result;
  }
  parse_seq(...close_types) {
    const steps = [];
    while (!close_types.includes(this.tokens[0]?.type)) {
      steps.push(this.parse_expr());
    }
    return { type: 'seq', steps };
  }
  parse_subpats(close_type) {
    const subpats = [];
    while (true) {
      subpats.push(this.parse_seq(close_type, 'subpat_delimiter'));
      const next = this.tokens[0]?.type;
      if (next) {
        this.consume(next);
      }
      if (next === close_type) {
        break;
      }
    }
    return subpats;
  }
  parse_polymeter() {
    this.consume('open_polymeter');
    const subpats = this.parse_subpats('close_polymeter');
    return { type: 'polymeter', subpats };
  }
  parse_polyrhythm() {
    this.consume('open_polyrhythm');
    const subpats = this.parse_subpats('close_polyrhythm');
    return { type: 'polyrhythm', subpats };
  }
  parse_slowpolymeter() {
    this.consume('open_slowpolymeter');
    const subpats = this.parse_subpats('close_slowpolymeter');
    return { type: 'slowpolymeter', subpats };
  }
}

function patternifyTree(tree) {
  if (tree.type === 'polyrhythm') {
    const args = tree.subpats.map((arg) => patternifyTree(arg));
    return strudel.polyrhythm(...args);
  }
  if (tree.type === 'slowpolymeter') {
    const args = tree.subpats.map((arg) => patternifyTree(arg));
    return strudel.s_polymeterSteps(1, ...args);
  }
  if (tree.type === 'polymeter') {
    const args = tree.subpats.map((subpat) => patternifyTree(subpat));
    return strudel.s_polymeter(...args);
  }
  if (tree.type === 'fast') {
    const step = patternifyTree(tree.step);
    const factor = patternifyTree(tree.factor);
    return strudel.fast(factor, step);
  }
  if (tree.type === 'slow') {
    const step = patternifyTree(tree.step);
    const factor = patternifyTree(tree.factor);
    return strudel.slow(factor, step);
  }
  if (tree.type === 'plain') {
    return strudel.pure(tree.value).withLoc(tree.location[0], tree.location[1]);
  }
  if (tree.type === 'seq') {
    const steps = tree.steps.map((step) => patternifyTree(step));
    return strudel.fastcat(...steps);
  }
}

const parser = new Parser();
export const m = (code, global_offset) => {
  const tree = parser.parse(code, global_offset + 1);
  const pat = patternifyTree(tree);
  return strudel.reify(pat);
};

// takes quoted mini string, returns all nodes that are leaves
export const getLeafLocations = (code, start) => {
  code = code.replace(/^"/, '');
  code = code.replace(/"$/, '');
  const leaves = tokenize(code, start).filter((x) => x.type == 'plain');
  return leaves.map((x) => x.location.map((y) => y + 1));
};

// mini notation only (wraps in "")
export const mini = (...strings) => {
  const pats = strings.map(m);
  return strudel.sequence(...pats);
};

export function minify(thing) {
  if (typeof thing === 'string') {
    return mini(thing);
  }
  return strudel.reify(thing);
}

// calling this function will cause patterns to parse strings as mini notation by default
export function miniAllStrings() {
  strudel.setStringParser(mini);
}
