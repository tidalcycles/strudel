/*
mini.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/mini.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as krill from './krill-parser.js';
import * as strudel from '@strudel.cycles/core';

const randOffset = 0.0002;

const applyOptions = (parent, code) => (pat, i) => {
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
          pat = strudel.reify(pat)[type](patternifyAST(amount, code));
          break;
        }
        case 'bjorklund': {
          if (op.arguments_.rotation) {
            pat = pat.euclidRot(
              patternifyAST(op.arguments_.pulse, code),
              patternifyAST(op.arguments_.step, code),
              patternifyAST(op.arguments_.rotation, code),
            );
          } else {
            pat = pat.euclid(patternifyAST(op.arguments_.pulse, code), patternifyAST(op.arguments_.step, code));
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
          const friend = patternifyAST(op.arguments_.element, code);
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

export function patternifyAST(ast, code) {
  switch (ast.type_) {
    case 'pattern': {
      resolveReplications(ast);
      const children = ast.source_.map((child) => patternifyAST(child, code)).map(applyOptions(ast, code));
      const alignment = ast.arguments_.alignment;
      if (alignment === 'stack') {
        return strudel.stack(...children);
      }
      if (alignment === 'polymeter') {
        // polymeter
        const stepsPerCycle = ast.arguments_.stepsPerCycle
          ? patternifyAST(ast.arguments_.stepsPerCycle, code).fmap((x) => strudel.Fraction(x))
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
      return patternifyAST(ast.source_, code);
    }
    case 'atom': {
      if (ast.source_ === '~') {
        return strudel.silence;
      }
      if (!ast.location_) {
        console.warn('no location for', ast);
        return ast.source_;
      }
      const { start, end } = ast.location_;
      const value = !isNaN(Number(ast.source_)) ? Number(ast.source_) : ast.source_;
      // the following line expects the shapeshifter append .withMiniLocation
      // because location_ is only relative to the mini string, but we need it relative to whole code
      // make sure whitespaces are not part of the highlight:
      const actual = code?.split('').slice(start.offset, end.offset).join('');
      const [offsetStart = 0, offsetEnd = 0] = actual
        ? actual.split(ast.source_).map((p) => p.split('').filter((c) => c === ' ').length)
        : [];
      return strudel
        .pure(value)
        .withLocation(
          [start.line, start.column + offsetStart, start.offset + offsetStart],
          [start.line, end.column - offsetEnd, end.offset - offsetEnd],
        );
    }
    case 'stretch':
      return patternifyAST(ast.source_, code).slow(patternifyAST(ast.arguments_.amount, code));
    /* case 'scale':
      let [tonic, scale] = Scale.tokenize(ast.arguments_.scale);
      const intervals = Scale.get(scale).intervals;
      const pattern = patternifyAST(ast.source_);
      tonic = tonic || 'C4';
      // console.log('scale', ast, pattern, tonic, scale);
      console.log('tonic', tonic);
      return pattern.fmap((step: any) => {
        step = Number(step);
        if (isNaN(step)) {
          console.warn(`scale step "${step}" not a number`);
          return step;
        }
        const octaves = Math.floor(step / intervals.length);
        const mod = (n: number, m: number): number => (n < 0 ? mod(n + m, m) : n % m);
        const index = mod(step, intervals.length); // % with negative numbers. e.g. -1 % 3 = 2
        const interval = Interval.add(intervals[index], Interval.fromSemitones(octaves * 12));
        return Note.transpose(tonic, interval || '1P');
      }); */
    /* case 'struct':
      // TODO:
      return strudel.silence; */
    default:
      console.warn(`node type "${ast.type_}" not implemented -> returning silence`);
      return strudel.silence;
  }
}

// mini notation only (wraps in "")
export const mini = (...strings) => {
  const pats = strings.map((str) => {
    const code = `"${str}"`;
    const ast = krill.parse(code);
    return patternifyAST(ast, code);
  });
  return strudel.sequence(...pats);
};

// includes haskell style (raw krill parsing)
export const h = (string) => {
  const ast = krill.parse(string);
  // console.log('ast', ast);
  return patternifyAST(ast, string);
};

export function minify(thing) {
  if (typeof thing === 'string') {
    return mini(thing);
  }
  return strudel.reify(thing);
}
