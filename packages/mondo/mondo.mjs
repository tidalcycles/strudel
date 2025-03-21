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
    pipe: /^\./,
    stack: /^[,$]/,
    or: /^[|]/,
    plain: /^[a-zA-Z0-9-~_^]+/,
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
  desugar_children(children) {
    children = this.resolve_ops(children);
    children = this.resolve_pipes(children);
    return children;
  }
  // Token[] => Token[][] . returns empty list if type not found
  split_children(children, split_type, sequence_type) {
    if (sequence_type) {
      // if given, the first child is ignored
      children = children.slice(1);
    }
    const chunks = [];
    while (true) {
      let commaIndex = children.findIndex((child) => child.type === split_type);
      if (commaIndex === -1) break;
      const chunk = children.slice(0, commaIndex);
      chunk.length && chunks.push(chunk);
      children = children.slice(commaIndex + 1);
    }
    if (!chunks.length) {
      return [];
    }
    chunks.push(children);
    return chunks;
  }
  desugar_split(children, split_type, sequence_type) {
    // children is expected to contain square or angle as first item
    const chunks = this.split_children(children, split_type, sequence_type);
    if (!chunks.length) {
      return this.desugar_children(children);
    }
    // collect args of stack function
    const args = chunks.map((chunk) => {
      if (chunk.length === 1) {
        // chunks of one element can be added to the stack as is
        return chunk[0];
      } else {
        // chunks of multiple args
        if (sequence_type) {
          // if given, each chunk needs to be prefixed
          // [a b, c d] => (stack (square a b) (square c d))
          chunk = [{ type: 'plain', value: sequence_type }, ...chunk];
        }
        chunk = this.desugar_children(chunk);
        return { type: 'list', children: chunk };
      }
    });
    return [{ type: 'plain', value: split_type }, ...args];
  }
  // prevents to get a list, e.g. ((x y)) => (x y)
  unwrap_children(children) {
    if (children.length === 1) {
      return children[0].children;
    }
    return children;
  }
  resolve_ops(children) {
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
      const call = { type: 'list', children: [op, left, right] };
      // insert call while keeping other siblings
      children = [...children.slice(0, opIndex - 1), call, ...children.slice(opIndex + 2)];
      children = this.unwrap_children(children);
    }
    return children;
  }
  resolve_pipes(children) {
    while (true) {
      let pipeIndex = children.findIndex((child) => child.type === 'pipe');
      // no pipe => we're done
      if (pipeIndex === -1) break;
      // pipe up front => lambda
      if (pipeIndex === 0) {
        // . as lambda: (.fast 2) = (lambda (_) (fast _ 2))
        const args = [{ type: 'plain', value: '_' }];
        const body = this.desugar([args[0], ...children]);
        return [
          { type: 'plain', value: 'lambda' },
          { type: 'list', children: args },
          { type: 'list', children: body },
        ];
      }
      const rightSide = children.slice(pipeIndex + 2);
      const right = children[pipeIndex + 1];
      if (right.type === 'list') {
        // apply function only to left sibling (high precedence)
        // s jazz.(fast 2) => s (fast jazz 2)
        const [callee, ...rest] = right.children;
        const leftSide = children.slice(0, pipeIndex - 1);
        const left = children[pipeIndex - 1];
        let args = [callee, left, ...rest];
        const call = { type: 'list', children: args };
        children = [...leftSide, call, ...rightSide];
      } else {
        // apply function to all left siblings (low precedence)
        // s jazz . fast 2 => fast (s jazz) 2
        let leftSide = children.slice(0, pipeIndex);
        if (leftSide.length === 1) {
          leftSide = leftSide[0];
        } else {
          // wrap in (..) if multiple items on the left side
          leftSide = { type: 'list', children: leftSide };
        }
        children = [right, leftSide, ...rightSide];
      }
    }
    return children;
  }
  flip_call(children) {
    let [name, first, ...rest] = children;
    return [name, ...rest, first];
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
    // not really needed but more readable and might be extended in the future
    children = this.desugar_split(children, 'or', type);
    children = this.desugar_split(children, 'stack', type);
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
        return ast.children.slice(1).forEach((child) => walk(child, locations));
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
  constructor(lib) {
    this.parser = new MondoParser();
    this.lib = lib;
    this.assert(!!this.lib.leaf, `no handler for leaft nodes! add "leaf" to your lib`);
    this.assert(!!this.lib.call, `no handler for call nodes! add "call" to your lib`);
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
    return this.call(ast);
  }
  errorhead(ast) {
    return `[mondo ${ast.loc?.join(':') || ''}]`;
  }
  call(ast, scope = []) {
    // for a node to be callable, it needs to be a list
    this.assert(ast.type === 'list', `${this.errorhead(ast)} function call: expected list, got ${ast.type}`);
    // the first element is expected to be the function name
    const first = ast.children[0];
    const name = first.value;
    this.assert(
      first?.type === 'plain',
      `${this.errorhead(first)} expected function name, got ${first.type}${name ? ` "${name}"` : ''}.`,
    );

    if (name === 'lambda') {
      const [_, args, body] = ast.children;
      const argNames = args.children.map((child) => child.value);
      // console.log('lambda', argNames, body.children);
      return (x) => {
        scope = {
          [argNames[0]]: x, // TODO: merge scope... + support multiple args
        };
        return this.call(body, scope);
      };
    }

    // process args
    const args = ast.children.slice(1).map((arg) => {
      if (arg.type === 'list') {
        return this.call(arg, scope);
      }

      if (arg.type === 'number') {
        arg.value = Number(arg.value);
      } else if (['quotes_double', 'quotes_single'].includes(arg.type)) {
        arg.value = arg.value.slice(1, -1);
      }
      return this.lib.leaf(arg, scope);
    });

    // look up function in lib
    return this.lib.call(name, args, scope);
  }
}
