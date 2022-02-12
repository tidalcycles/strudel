import * as krill from '../krill-parser';
import * as strudel from '../../strudel.mjs';
import { Scale, Note, Interval } from '@tonaljs/tonal';
import './tone';
import './midi';
import './voicings';
import * as toneStuff from './tone';
import shapeshifter from './shapeshifter';

// even if some functions are not used, we need them to be available in eval
const {
  pure,
  stack,
  slowcat,
  fastcat,
  cat,
  sequence,
  polymeter,
  pm,
  polyrhythm,
  pr,
  /* reify, */ silence,
  timeCat,
  Fraction,
  Pattern,
  TimeSpan,
  Hap,
} = strudel;
const { autofilter, filter, gain } = toneStuff;

function reify(thing: any) {
  if (thing?.constructor?.name === 'Pattern') {
    return thing;
  }
  return pure(thing);
}

function minify(thing: any) {
  if (typeof thing === 'string') {
    return mini(thing);
  }
  return reify(thing);
}

const applyOptions = (parent: any) => (pat: any, i: number) => {
  const ast = parent.source_[i];
  const options = ast.options_;
  const operator = options?.operator;
  if (operator) {
    switch (operator.type_) {
      case 'stretch':
        const speed = new Fraction(operator.arguments_.amount).inverse().valueOf();
        return reify(pat).fast(speed);
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
      `option${unimplemented.length > 1 ? 's' : ''} ${unimplemented.map((o) => `"${o}"`).join(', ')} not implemented`
    );
  }
  return pat;
};

export function patternifyAST(ast: any): any {
  switch (ast.type_) {
    case 'pattern':
      const children = ast.source_.map(patternifyAST).map(applyOptions(ast));
      if (ast.arguments_.alignment === 'v') {
        return stack(...children);
      }
      const weightedChildren = ast.source_.some((child) => !!child.options_?.weight);
      if (weightedChildren) {
        return timeCat(...ast.source_.map((child, i) => [child.options_?.weight || 1, children[i]]));
      }
      return sequence(...children);
    case 'element':
      if (ast.source_ === '~') {
        return silence;
      }
      if (typeof ast.source_ !== 'object') {
        return ast.source_;
      }
      return patternifyAST(ast.source_);
    case 'stretch':
      return patternifyAST(ast.source_).slow(ast.arguments_.amount);
    case 'scale':
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
      });
    /* case 'struct':
      // TODO:
      return silence; */
    default:
      console.warn(`node type "${ast.type_}" not implemented -> returning silence`);
      return silence;
  }
}

// mini notation only (wraps in "")
export const mini = (...strings: string[]) => {
  const pattern = sequence(
    ...strings.map((str) => {
      const ast = krill.parse(`"${str}"`);
      // console.log('ast', ast);
      return patternifyAST(ast);
    })
  );
  return pattern;
};

// shorthand for mini
const m = mini;
// shorthand for stack, automatically minifying strings
const s = (...strings) => {
  const patternified = strings.map((s) => minify(s));
  return stack(...patternified);
};

// includes haskell style (raw krill parsing)
export const h = (string: string) => {
  const ast = krill.parse(string);
  // console.log('ast', ast);
  return patternifyAST(ast);
};

export const parse: any = (code: string) => {
  let _pattern;
  let mode;
  try {
    _pattern = h(code);
    mode = 'pegjs';
  } catch (err) {
    // code is not haskell like
    mode = 'javascript';
    code = shapeshifter(code);
    _pattern = eval(code);
    if (_pattern?.constructor?.name !== 'Pattern') {
      const message = `got "${typeof _pattern}" instead of pattern`;
      throw new Error(message + (typeof _pattern === 'function' ? ', did you forget to call a function?' : '.'));
    }
  }
  return { mode, pattern: _pattern };
};
