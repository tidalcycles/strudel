import * as krill from "../_snowpack/link/repl/krill-parser.js";
import * as strudel from "../_snowpack/link/strudel.js";
const {sequence, silence} = strudel;
export function patternifyAST(ast) {
  switch (ast.type_) {
    case "pattern":
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
  return sequence(...strings.map((str) => patternifyAST(krill.parse(`"${str}"`))));
};
