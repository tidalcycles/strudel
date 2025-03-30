/*
mondo.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/test/mini.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// evolved from https://garten.salat.dev/lisp/parser.html
export class MondoParser {
  // these are the tokens we expect
  token_types = {
    quotes_double: /^"(.*?)"/,
    quotes_single: /^'(.*?)'/,
    open_list: /^\(/,
    close_list: /^\)/,
    open_angle: /^</,
    close_angle: /^>/,
    open_square: /^\[/,
    close_square: /^\]/,
    open_curly: /^\{/,
    close_curly: /^\}/,
    number: /^-?[0-9]*\.?[0-9]+/, // before pipe!
    op: /^[*/:!@%?]|^\.{2}/, // * / : ! @ % ? ..
    // dollar: /^\$/,
    pipe: /^\./,
    stack: /^[,$]/,
    or: /^[|]/,
    plain: /^[a-zA-Z0-9-~_^#]+/,
  };
  // matches next token
  next_token(code, offset = 0) {
    for (let type in this.token_types) {
      const match = code.match(this.token_types[type]);
      if (match) {
        let token = { type, value: match[0] };
        if (offset !== -1) {
          // add location
          token.loc = [offset, offset + match[0].length];
        }
        return token;
      }
    }
    throw new Error(`mondo: could not match '${code}'`);
  }
  // takes code string, returns list of matched tokens (if valid)
  tokenize(code, offset = 0) {
    let tokens = [];
    let locEnabled = offset !== -1;
    let trim = () => {
      // trim whitespace at start, update offset
      offset += code.length - code.trimStart().length;
      // trim start and end to not confuse parser
      return code.trim();
    };
    code = trim();
    while (code.length > 0) {
      code = trim();
      const token = this.next_token(code, locEnabled ? offset : -1);
      code = code.slice(token.value.length);
      offset += token.value.length;
      tokens.push(token);
    }
    return tokens;
  }
  // take code, return abstract syntax tree
  parse(code, offset) {
    this.code = code;
    this.offset = offset;
    this.tokens = this.tokenize(code, offset);
    const expressions = [];
    while (this.tokens.length) {
      expressions.push(this.parse_expr());
    }
    if (expressions.length === 0) {
      // empty case
      return { type: 'list', children: [] };
    }
    // do we have multiple top level expressions or a single non list?
    if (expressions.length > 1 || expressions[0].type !== 'list') {
      return {
        type: 'list',
        children: this.desugar(expressions),
      };
    }
    // we have a single list
    return expressions[0];
  }
  // parses any valid expression
  parse_expr() {
    if (!this.tokens[0]) {
      throw new Error(`unexpected end of file`);
    }
    let next = this.tokens[0]?.type;
    if (next === 'open_list') {
      return this.parse_list();
    }
    if (next === 'open_angle') {
      return this.parse_angle();
    }
    if (next === 'open_square') {
      return this.parse_square();
    }
    if (next === 'open_curly') {
      return this.parse_curly();
    }
    return this.consume(next);
  }
  // Token[] => Token[][], e.g. (x , y z) => [['x'],['y','z']]
  split_children(children, split_type) {
    const chunks = [];
    while (true) {
      let splitIndex = children.findIndex((child) => child.type === split_type);
      if (splitIndex === -1) break;
      const chunk = children.slice(0, splitIndex);
      chunks.push(chunk);
      children = children.slice(splitIndex + 1);
    }
    chunks.push(children);
    return chunks;
  }
  desugar_split(children, split_type, next) {
    const chunks = this.split_children(children, split_type);
    if (chunks.length === 1) {
      return next(children);
    }
    // collect args of stack function
    const args = chunks
      .map((chunk) => {
        if (!chunk.length) {
          return; // useful for things like "$ s bd $ s hh*8" (first chunk is empty)
        }
        if (chunk.length === 1) {
          // chunks of one element can be added to the stack as is
          return chunk[0];
        }
        // chunks of multiple args
        chunk = next(chunk);
        return { type: 'list', children: chunk };
      })
      .filter(Boolean); // ignore empty chunks
    return [{ type: 'plain', value: split_type }, ...args];
  }
  // prevents to get a list, e.g. ((x y)) => (x y)
  unwrap_children(children) {
    if (children.length === 1) {
      return children[0].children;
    }
    return children;
  }
  desugar_ops(children) {
    while (true) {
      let opIndex = children.findIndex((child) => child.type === 'op');
      if (opIndex === -1) break;
      const op = { type: 'plain', value: children[opIndex].value };
      if (opIndex === children.length - 1) {
        throw new Error(`cannot use operator as last child.`);
      }
      if (opIndex === 0) {
        // regular function call (assuming each operator exists as function)
        children[opIndex] = op;
        continue;
      }
      // convert infix to prefix notation
      const left = children[opIndex - 1];
      const right = children[opIndex + 1];
      if (left.type === 'pipe') {
        // "x !* 2" => (* 2 x)
        children[opIndex] = op;
        continue;
      }
      const call = { type: 'list', children: [op, right, left] };
      // insert call while keeping other siblings
      children = [...children.slice(0, opIndex - 1), call, ...children.slice(opIndex + 2)];
      children = this.unwrap_children(children);
    }
    return children;
  }
  get_lambda(args, children) {
    // (.fast 2) = (fn (_) (fast _ 2))
    children = this.desugar(children);
    const body = children.length === 1 ? children[0] : { type: 'list', children };
    return [{ type: 'plain', value: 'fn' }, { type: 'list', children: args }, body];
  }
  // returns location range of given ast (even if desugared)
  get_range(ast, range = [Infinity, 0]) {
    let union = (a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
    if (ast.loc) {
      return union(range, ast.loc);
    }
    if (ast.type !== 'list') {
      return range;
    }
    return ast.children.reduce((range, child) => {
      const childrange = this.get_range(child, range);
      return union(range, childrange);
    }, range);
  }
  errorhead(ast) {
    return `[mondo ${this.get_range(ast)?.join(':') || '?'}]`;
  }
  // returns original user code where the given ast originates (even if desugared)
  get_code_snippet(ast) {
    const [min, max] = this.get_range(ast);
    return this.code.slice(min - this.offset, max - this.offset);
  }
  desugar_pipes(children) {
    let chunks = this.split_children(children, 'pipe');
    while (chunks.length > 1) {
      let [left, right, ...rest] = chunks;

      if (!left.length) {
        const arg = { type: 'plain', value: '_' };
        return this.get_lambda([arg], [arg, ...children]);
      }
      // s jazz hh.fast 2 => (fast 2 (s jazz hh))
      const call = left.length > 1 ? { type: 'list', children: left } : left[0];
      chunks = [[...right, call], ...rest];
    }
    // return next(chunks[0]);
    return chunks[0];
  }
  parse_pair(open_type, close_type) {
    this.consume(open_type);
    const children = [];
    while (this.tokens[0]?.type !== close_type) {
      children.push(this.parse_expr());
    }
    this.consume(close_type);
    return children;
  }
  desugar(children, type) {
    // if type is given, the first element is expected to contain it as plain value
    // e.g. with (square a b, c), we want to split (a b, c) and ignore "square"
    children = type ? children.slice(1) : children;
    children = this.desugar_split(children, 'stack', (children) =>
      this.desugar_split(children, 'or', (children) => {
        // chunks of multiple args
        if (type) {
          // the type we've removed before splitting needs to be added back
          children = [{ type: 'plain', value: type }, ...children];
        }
        children = this.desugar_ops(children);
        // children = this.desugar_pipes(children, (children) => this.desugar_dollars(children));
        children = this.desugar_pipes(children);
        return children;
      }),
    );
    return children;
  }
  parse_list() {
    let children = this.parse_pair('open_list', 'close_list');
    children = this.desugar(children);
    return { type: 'list', children };
  }
  parse_angle() {
    let children = this.parse_pair('open_angle', 'close_angle');
    children = [{ type: 'plain', value: 'angle' }, ...children];
    children = this.desugar(children, 'angle');
    return { type: 'list', children };
  }
  parse_square() {
    let children = this.parse_pair('open_square', 'close_square');
    children = [{ type: 'plain', value: 'square' }, ...children];
    children = this.desugar(children, 'square');
    return { type: 'list', children };
  }
  parse_curly() {
    let children = this.parse_pair('open_curly', 'close_curly');
    children = [{ type: 'plain', value: 'curly' }, ...children];
    children = this.desugar(children, 'curly');
    return { type: 'list', children };
  }
  consume(type) {
    // shift removes first element and returns it
    const token = this.tokens.shift();
    if (token.type !== type) {
      throw new Error(`expected token type ${type}, got ${token.type}`);
    }
    return token;
  }
  get_locations(code, offset = 0) {
    let walk = (ast, locations = []) => {
      if (ast.type === 'list') {
        return ast.children.forEach((child) => walk(child, locations));
      }
      if (ast.loc) {
        locations.push(ast.loc);
      }
    };
    const ast = this.parse(code, offset);
    let locations = [];
    walk(ast, locations);
    return locations;
  }
}

export function printAst(ast, compact = false, lvl = 0) {
  const br = compact ? '' : '\n';
  const spaces = compact ? '' : Array(lvl).fill(' ').join('');
  if (ast.type === 'list') {
    return `${lvl ? br : ''}${spaces}(${ast.children.map((child) => printAst(child, compact, lvl + 1)).join(' ')}${
      ast.children.find((child) => child.type === 'list') ? `${br}${spaces})` : ')'
    }`;
  }
  return `${ast.value}`;
}

// lisp runner
export class MondoRunner {
  constructor({ evaluator } = {}) {
    this.parser = new MondoParser();
    this.evaluator = evaluator;
    this.assert(typeof evaluator === 'function', `expected an evaluator function to be passed to new MondoRunner`);
  }
  // a helper to check conditions and throw if they are not met
  assert(condition, error) {
    if (!condition) {
      throw new Error(error);
    }
  }
  run(code, offset = 0) {
    const ast = this.parser.parse(code, offset);
    console.log(printAst(ast));
    return this.evaluate(ast);
  }
  evaluate_def(ast, scope) {
    // (def name body)
    if (ast.children.length !== 3) {
      throw new Error(`expected "def" to have 3 children, but got ${ast.children.length}`);
    }
    const name = ast.children[1].value;
    const body = this.evaluate(ast.children[2], scope);
    scope[name] = body;
    return this.evaluator(ast, scope);
  }
  evaluate_lambda(ast, scope) {
    // (fn (_)   (ply 2 _)
    //     ^args ^ body
    const [_, args, body] = ast.children;
    const argNames = args.children.map((child) => child.value);
    return (x) => {
      scope = {
        [argNames[0]]: x, // TODO: merge scope... + support multiple args
      };
      return this.evaluate(body, scope);
    };
  }
  evaluate_list(ast, scope) {
    // evaluate all children before evaluating list (dont mutate!!!)
    const args = ast.children.map((arg) => this.evaluate(arg, scope));
    const node = { type: 'list', children: args };
    return this.evaluator(node, scope);
  }
  evaluate_leaf(ast, scope) {
    if (ast.type === 'number') {
      ast.value = Number(ast.value);
    } else if (['quotes_double', 'quotes_single'].includes(ast.type)) {
      ast.value = ast.value.slice(1, -1);
    }
    return this.evaluator(ast, scope);
  }
  evaluate(ast, scope = {}) {
    if (ast.type !== 'list') {
      return this.evaluate_leaf(ast, scope);
    }
    if (ast.children[0]?.value === 'def') {
      return this.evaluate_def(ast, scope);
    }
    if (ast.children[0]?.value === 'fn') {
      return this.evaluate_lambda(ast, scope);
    }
    return this.evaluate_list(ast, scope);
  }
}
