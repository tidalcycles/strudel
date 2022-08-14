/*
mini.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/mini.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as krill from './krill-parser.js';
import * as strudel from '@strudel.cycles/core';
import { addMiniLocations } from '@strudel.cycles/eval/shapeshifter.mjs';

const { pure, Pattern, Fraction, stack, slowcat, sequence, timeCat, silence, reify } = strudel;

var _seedState = 0;
const randOffset = 0.0002;

function _nextSeed() {
  return _seedState++;
}

const applyOptions = (parent) => (pat, i) => {
  const ast = parent.source_[i];
  const options = ast.options_;
  const operator = options?.operator;
  if (operator) {
    switch (operator.type_) {
      case 'stretch':
        const speed = Fraction(operator.arguments_.amount).inverse();
        return reify(pat).fast(speed);
      case 'bjorklund':
        return pat.euclid(operator.arguments_.pulse, operator.arguments_.step, operator.arguments_.rotation);
      case 'degradeBy':
        return reify(pat)._degradeByWith(strudel.rand.early(randOffset * _nextSeed()).segment(1), operator.arguments_.amount);
      // TODO: case 'fixed-step': "%"
    }
    console.warn(`operator "${operator.type_}" not implemented`);
  }
  if (options?.weight) {
    // weight is handled by parent
    return pat;
  }
  // TODO: bjorklund e.g. "c3(5,8)"
  const unimplemented = Object.keys(options || {}).filter((key) => key !== 'operator');
  if (unimplemented.length) {
    console.warn(
      `option${unimplemented.length > 1 ? 's' : ''} ${unimplemented.map((o) => `"${o}"`).join(', ')} not implemented`,
    );
  }
  return pat;
};

function resolveReplications(ast) {
  // the general idea here: x!3 = [x*3]@3
  // could this be made easier?!
  ast.source_ = ast.source_.map((child) => {
    const { replicate, ...options } = child.options_ || {};
    if (replicate) {
      return {
        ...child,
        options_: { ...options, weight: replicate },
        source_: {
          type_: 'pattern',
          arguments_: {
            alignment: 'h',
          },
          source_: [
            {
              type_: 'element',
              source_: child.source_,
              location_: child.location_,
              options_: {
                operator: {
                  type_: 'stretch',
                  arguments_: { amount: Fraction(replicate).inverse().toString() },
                },
              },
            },
          ],
        },
      };
    }
    return child;
  });
}

export function patternifyAST(ast) {
  switch (ast.type_) {
    case 'pattern':
      resolveReplications(ast);
      const children = ast.source_.map(patternifyAST).map(applyOptions(ast));
      const alignment = ast.arguments_.alignment;
      if (alignment === 'v') {
        return stack(...children);
      }
      if (alignment === 'r') {
        return strudel.chooseInWith(strudel.rand.early(randOffset * _nextSeed()).segment(1), children);
      }
      const weightedChildren = ast.source_.some((child) => !!child.options_?.weight);
      if (!weightedChildren && alignment === 't') {
        return slowcat(...children);
      }
      if (weightedChildren) {
        const pat = timeCat(...ast.source_.map((child, i) => [child.options_?.weight || 1, children[i]]));
        if (alignment === 't') {
          const weightSum = ast.source_.reduce((sum, child) => sum + (child.options_?.weight || 1), 0);
          return pat._slow(weightSum); // timecat + slow
        }
        return pat;
      }
      return sequence(...children);
    case 'element':
      if (ast.source_ === '~') {
        return silence;
      }
      if (typeof ast.source_ !== 'object') {
        if (!addMiniLocations) {
          return ast.source_;
        }
        if (!ast.location_) {
          console.warn('no location for', ast);
          return ast.source_;
        }
        const { start, end } = ast.location_;
        const value = !isNaN(Number(ast.source_)) ? Number(ast.source_) : ast.source_;
        // the following line expects the shapeshifter append .withMiniLocation
        // because location_ is only relative to the mini string, but we need it relative to whole code
        return pure(value).withLocation([start.line, start.column, start.offset], [end.line, end.column, end.offset]);
      }
      return patternifyAST(ast.source_);
    case 'stretch':
      return patternifyAST(ast.source_).slow(ast.arguments_.amount);
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
      return silence; */
    default:
      console.warn(`node type "${ast.type_}" not implemented -> returning silence`);
      return silence;
  }
}

// mini notation only (wraps in "")
export const mini = (...strings) => {
  const pats = strings.map((str) => {
    const ast = krill.parse(`"${str}"`);
    return patternifyAST(ast);
  });
  return sequence(...pats);
};

// includes haskell style (raw krill parsing)
export const h = (string) => {
  const ast = krill.parse(string);
  // console.log('ast', ast);
  return patternifyAST(ast);
};

// shorthand for mini
Pattern.prototype.define('mini', mini, { composable: true });
Pattern.prototype.define('m', mini, { composable: true });
Pattern.prototype.define('h', h, { composable: true });

export function minify(thing) {
  if (typeof thing === 'string') {
    return mini(thing);
  }
  return reify(thing);
}
