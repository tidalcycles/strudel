import * as krill from '../krill-parser';
import * as strudel from '../../strudel.mjs';

const { sequence, silence } = strudel;

export function patternifyAST(ast: any): any {
  switch (ast.type_) {
    case 'pattern':
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
}
/* export default (str: string) => patternifyAST(krill.parse(`"${str}"`)); */

export default (...strings: string[]) => {
  return sequence(...strings.map((str) => patternifyAST(krill.parse(`"${str}"`))));
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
