import * as krill from '../krill-parser';
import * as strudel from '../../strudel.mjs';

const { sequence, stack, silence } = strudel;

export function patternifyAST(ast: any): any {
  switch (ast.type_) {
    case 'pattern':
      if (ast.arguments_.alignment === 'v') {
        return stack(...ast.source_.map(patternifyAST));
      }
      return sequence(...ast.source_.map(patternifyAST));
    case 'element':
      if (ast.source_ === '~') {
        return silence;
      }
      if (typeof ast.source_ !== 'object') {
        return ast.source_;
      }
      return patternifyAST(ast.source_);
  }
  // *3 => options_.operator.arguments_.amount = 1/3
}
/* export default (str: string) => patternifyAST(krill.parse(`"${str}"`)); */

export default (...strings: string[]) => {
  const pattern = sequence(
    ...strings.map((str) => {
      const ast = krill.parse(`"${str}"`);
      // console.log('ast', ast);
      return patternifyAST(ast);
    })
  );
  // console.log('mini pattern', pattern);
  return pattern;
};

/* 
TODO:
export interface Arguments {
  alignment: string;
}

export interface ElementStub {
  type_: string;
  source_: string;
  options_?: any;
}

export interface PatternStub {
  type_: string; // pattern
  arguments_: Arguments;
  source_: ElementStub[];
}
 */
