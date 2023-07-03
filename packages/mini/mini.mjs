/*
mini.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/mini.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as krill from './krill-parser.js';
import * as strudel from '@strudel.cycles/core';

const randOffset = 0.0003;

const applyOptions = (parent, enter) => (pat, i) => {
  const ast = parent.source_[i];
  const options = ast.options_;
  const ops = options?.ops;

  if (ops) {
    for (const op of ops) {
      switch (op.type_) {
        case 'stretch': {
          const legalTypes = ['fast', 'slow'];
          const { type, amount } = op.arguments_;
          if (!legalTypes.includes(type)) {
            throw new Error(`mini: stretch: type must be one of ${legalTypes.join('|')} but got ${type}`);
          }
          pat = strudel.reify(pat)[type](enter(amount));
          break;
        }
        case 'bjorklund': {
          if (op.arguments_.rotation) {
            pat = pat.euclidRot(enter(op.arguments_.pulse), enter(op.arguments_.step), enter(op.arguments_.rotation));
          } else {
            pat = pat.euclid(enter(op.arguments_.pulse), enter(op.arguments_.step));
          }
          break;
        }
        case 'degradeBy': {
          pat = strudel
            .reify(pat)
            ._degradeByWith(strudel.rand.early(randOffset * op.arguments_.seed), op.arguments_.amount ?? 0.5);
          break;
        }
        case 'tail': {
          const friend = enter(op.arguments_.element);
          pat = pat.fmap((a) => (b) => Array.isArray(a) ? [...a, b] : [a, b]).appLeft(friend);
          break;
        }
        default: {
          console.warn(`operator "${op.type_}" not implemented`);
        }
      }
    }
  }

  return pat;
};

function resolveReplications(ast) {
  ast.source_ = strudel.flatten(
    ast.source_.map((child) => {
      const { reps } = child.options_ || {};
      if (!reps) {
        return [child];
      }
      delete child.options_.reps;
      return Array(reps).fill(child);
    }),
  );
}

// expects ast from mini2ast + quoted mini string + optional callback when a node is entered
export function patternifyAST(ast, code, onEnter, offset = 0) {
  onEnter?.(ast);
  const enter = (node) => patternifyAST(node, code, onEnter, offset);
  switch (ast.type_) {
    case 'pattern': {
      resolveReplications(ast);
      const children = ast.source_.map((child) => enter(child)).map(applyOptions(ast, enter));
      const alignment = ast.arguments_.alignment;
      if (alignment === 'stack') {
        return strudel.stack(...children);
      }
      if (alignment === 'polymeter') {
        // polymeter
        const stepsPerCycle = ast.arguments_.stepsPerCycle
          ? enter(ast.arguments_.stepsPerCycle).fmap((x) => strudel.Fraction(x))
          : strudel.pure(strudel.Fraction(children.length > 0 ? children[0].__weight : 1));

        const aligned = children.map((child) => child.fast(stepsPerCycle.fmap((x) => x.div(child.__weight || 1))));
        return strudel.stack(...aligned);
      }
      if (alignment === 'rand') {
        return strudel.chooseInWith(strudel.rand.early(randOffset * ast.arguments_.seed).segment(1), children);
      }
      const weightedChildren = ast.source_.some((child) => !!child.options_?.weight);
      if (!weightedChildren && alignment === 'slowcat') {
        return strudel.slowcat(...children);
      }
      if (weightedChildren) {
        const weightSum = ast.source_.reduce((sum, child) => sum + (child.options_?.weight || 1), 0);
        const pat = strudel.timeCat(...ast.source_.map((child, i) => [child.options_?.weight || 1, children[i]]));
        if (alignment === 'slowcat') {
          return pat._slow(weightSum); // timecat + slow
        }
        pat.__weight = weightSum;
        return pat;
      }
      const pat = strudel.sequence(...children);
      pat.__weight = children.length;
      return pat;
    }
    case 'element': {
      return enter(ast.source_);
    }
    case 'atom': {
      if (ast.source_ === '~') {
        return strudel.silence;
      }
      if (!ast.location_) {
        console.warn('no location for', ast);
        return ast.source_;
      }
      const value = !isNaN(Number(ast.source_)) ? Number(ast.source_) : ast.source_;
      if (offset === -1) {
        // skip location handling (used when getting leaves to avoid confusion)
        return strudel.pure(value);
      }
      const [from, to] = getLeafLocation(code, ast, offset);
      return strudel.pure(value).withLoc(from, to);
    }
    case 'stretch':
      return enter(ast.source_).slow(enter(ast.arguments_.amount));
    default:
      console.warn(`node type "${ast.type_}" not implemented -> returning silence`);
      return strudel.silence;
  }
}

// takes quoted mini string + leaf node within, returns source location of node (whitespace corrected)
export const getLeafLocation = (code, leaf, globalOffset = 0) => {
  // value is expected without quotes!
  const { start, end } = leaf.location_;
  const actual = code?.split('').slice(start.offset, end.offset).join('');
  // make sure whitespaces are not part of the highlight
  const [offsetStart = 0, offsetEnd = 0] = actual
    ? actual.split(leaf.source_).map((p) => p.split('').filter((c) => c === ' ').length)
    : [];
  return [start.offset + offsetStart + globalOffset, end.offset - offsetEnd + globalOffset];
};

// takes quoted mini string, returns ast
export const mini2ast = (code) => krill.parse(code);

// takes quoted mini string, returns all nodes that are leaves
export const getLeaves = (code) => {
  const ast = mini2ast(code);
  let leaves = [];
  patternifyAST(
    ast,
    code,
    (node) => {
      if (node.type_ === 'atom') {
        leaves.push(node);
      }
    },
    -1,
  );
  return leaves;
};

// takes quoted mini string, returns locations [fromCol,toCol] of all leaf nodes
export const getLeafLocations = (code, offset = 0) => {
  return getLeaves(code).map((l) => getLeafLocation(code, l, offset));
};

// mini notation only (wraps in "")
export const mini = (...strings) => {
  const pats = strings.map((str) => {
    const code = `"${str}"`;
    const ast = mini2ast(code);
    return patternifyAST(ast, code);
  });
  return strudel.sequence(...pats);
};

// turns str mini string (without quotes) into pattern
// offset is the position of the mini string in the JS code
// each leaf node will get .withLoc added
// this function is used by the transpiler for double quoted strings
export const m = (str, offset) => {
  const code = `"${str}"`;
  const ast = mini2ast(code);
  return patternifyAST(ast, code, null, offset);
};

// includes haskell style (raw krill parsing)
export const h = (string) => {
  const ast = mini2ast(string);
  return patternifyAST(ast, string);
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
