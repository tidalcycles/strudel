import * as krill from "../_snowpack/link/repl/krill-parser.js";
import * as strudel from "../_snowpack/link/strudel.js";
import {Scale, Note, Interval} from "../_snowpack/pkg/@tonaljs/tonal.js";
import {addMiniLocations} from "./shapeshifter.js";
const {pure, Pattern, Fraction, stack, slowcat, sequence, timeCat, silence} = strudel;
const applyOptions = (parent) => (pat, i) => {
  const ast = parent.source_[i];
  const options = ast.options_;
  const operator = options?.operator;
  if (operator) {
    switch (operator.type_) {
      case "stretch":
        const speed = new Fraction(operator.arguments_.amount).inverse().valueOf();
        return reify(pat).fast(speed);
    }
    console.warn(`operator "${operator.type_}" not implemented`);
  }
  if (options?.weight) {
    return pat;
  }
  const unimplemented = Object.keys(options || {}).filter((key) => key !== "operator");
  if (unimplemented.length) {
    console.warn(`option${unimplemented.length > 1 ? "s" : ""} ${unimplemented.map((o) => `"${o}"`).join(", ")} not implemented`);
  }
  return pat;
};
function resolveReplications(ast) {
  ast.source_ = ast.source_.map((child) => {
    const {replicate, ...options} = child.options_ || {};
    if (replicate) {
      return {
        ...child,
        options_: {...options, weight: replicate},
        source_: {
          type_: "pattern",
          arguments_: {
            alignment: "h"
          },
          source_: [
            {
              type_: "element",
              source_: child.source_,
              location_: child.location_,
              options_: {
                operator: {
                  type_: "stretch",
                  arguments_: {amount: String(new Fraction(replicate).inverse().valueOf())}
                }
              }
            }
          ]
        }
      };
    }
    return child;
  });
}
export function patternifyAST(ast) {
  switch (ast.type_) {
    case "pattern":
      resolveReplications(ast);
      const children = ast.source_.map(patternifyAST).map(applyOptions(ast));
      const alignment = ast.arguments_.alignment;
      if (alignment === "v") {
        return stack(...children);
      }
      const weightedChildren = ast.source_.some((child) => !!child.options_?.weight);
      if (!weightedChildren && alignment === "t") {
        return slowcat(...children);
      }
      if (weightedChildren) {
        const pat = timeCat(...ast.source_.map((child, i) => [child.options_?.weight || 1, children[i]]));
        if (alignment === "t") {
          const weightSum = ast.source_.reduce((sum, child) => sum + (child.options_?.weight || 1), 0);
          return pat._slow(weightSum);
        }
        return pat;
      }
      return sequence(...children);
    case "element":
      if (ast.source_ === "~") {
        return silence;
      }
      if (typeof ast.source_ !== "object") {
        if (!addMiniLocations) {
          return ast.source_;
        }
        if (!ast.location_) {
          console.warn("no location for", ast);
          return ast.source_;
        }
        const {start, end} = ast.location_;
        return pure(ast.source_).withLocation({start, end});
      }
      return patternifyAST(ast.source_);
    case "stretch":
      return patternifyAST(ast.source_).slow(ast.arguments_.amount);
    case "scale":
      let [tonic, scale] = Scale.tokenize(ast.arguments_.scale);
      const intervals = Scale.get(scale).intervals;
      const pattern = patternifyAST(ast.source_);
      tonic = tonic || "C4";
      console.log("tonic", tonic);
      return pattern.fmap((step) => {
        step = Number(step);
        if (isNaN(step)) {
          console.warn(`scale step "${step}" not a number`);
          return step;
        }
        const octaves = Math.floor(step / intervals.length);
        const mod = (n, m) => n < 0 ? mod(n + m, m) : n % m;
        const index = mod(step, intervals.length);
        const interval = Interval.add(intervals[index], Interval.fromSemitones(octaves * 12));
        return Note.transpose(tonic, interval || "1P");
      });
    default:
      console.warn(`node type "${ast.type_}" not implemented -> returning silence`);
      return silence;
  }
}
export const mini = (...strings) => {
  const pats = strings.map((str) => {
    const ast = krill.parse(`"${str}"`);
    return patternifyAST(ast);
  });
  return sequence(...pats);
};
export const h = (string) => {
  const ast = krill.parse(string);
  return patternifyAST(ast);
};
Pattern.prototype.define("mini", mini, {composable: true});
Pattern.prototype.define("m", mini, {composable: true});
Pattern.prototype.define("h", h, {composable: true});
export function reify(thing) {
  if (thing?.constructor?.name === "Pattern") {
    return thing;
  }
  return pure(thing);
}
export function minify(thing) {
  if (typeof thing === "string") {
    return mini(thing);
  }
  return reify(thing);
}
