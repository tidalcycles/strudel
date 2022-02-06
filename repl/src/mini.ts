import * as krill from '../krill-parser';
import * as strudel from '../../strudel.mjs';

export function patternifyAST(ast: any): any {
  switch (ast.type_) {
    case 'pattern':
      return strudel.sequence(...ast.source_.map(patternifyAST));
    case 'element':
      if (typeof ast.source_ !== 'object') {
        return ast.source_;
      }
      return patternifyAST(ast.source_);
  }
}
export default (str: string) => patternifyAST(krill.parse(`"${str}"`));

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
