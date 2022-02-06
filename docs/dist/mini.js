import * as krill from "../_snowpack/link/repl/krill-parser.js";
import * as strudel from "../_snowpack/link/strudel.js";
const {sequence, stack, silence} = strudel;
export function patternifyAST(ast) {
  switch (ast.type_) {
    case "pattern":
      if (ast.arguments_.alignment === "v") {
        return stack(...ast.source_.map(patternifyAST));
      }
      return sequence(...ast.source_.map(patternifyAST));
    case "element":
      if (ast.source_ === "~") {
        return silence;
      }
      if (typeof ast.source_ !== "object") {
        return ast.source_;
      }
      return patternifyAST(ast.source_);
  }
}
export default (...strings) => {
  const pattern = sequence(...strings.map((str) => {
    const ast = krill.parse(`"${str}"`);
    return patternifyAST(ast);
  }));
  return pattern;
};
