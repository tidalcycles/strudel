/*
uzu.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/test/mini.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// evolved from https://garten.salat.dev/lisp/parser.html
export class UzuParser {
  // these are the tokens we expect
  token_types = {
    string: /^\"(.*?)\"/,
    open_list: /^\(/,
    close_list: /^\)/,
    open_cat: /^\</,
    close_cat: /^\>/,
    open_seq: /^\[/,
    close_seq: /^\]/,
    number: /^[0-9]*\.?[0-9]+/, // before pipe!
    pipe: /^\./,
    stack: /^\,/,
    op: /^[\*\/]/,
    plain: /^[a-zA-Z0-9\-]+/,
  };
  // matches next token
  next_token(code) {
    for (let type in this.token_types) {
      const match = code.match(this.token_types[type]);
      if (match) {
        return { type, value: match[0] };
      }
    }
    throw new Error(`zilp: could not match '${code}'`);
  }
  // takes code string, returns list of matched tokens (if valid)
  tokenize(code) {
    let tokens = [];
    while (code.length > 0) {
      code = code.trim();
      const token = this.next_token(code);
      code = code.slice(token.value.length);
      tokens.push(token);
    }
    return tokens;
  }
  // take code, return abstract syntax tree
  parse(code) {
    this.tokens = this.tokenize(code);
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
        children: this.desugar_children(expressions),
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
    if (next === 'open_cat') {
      return this.parse_cat();
    }
    if (next === 'open_seq') {
      return this.parse_seq();
    }
    return this.consume(next);
  }
  desugar_children(children) {
    children = this.resolve_ops(children);
    children = this.resolve_pipes(children);
    return children;
  }
  // Token[] => Token[][] . returns empty list if type not found
  split_children(children, type) {
    const chunks = [];
    while (true) {
      let commaIndex = children.findIndex((child) => child.type === type);
      if (commaIndex === -1) break;
      const chunk = children.slice(0, commaIndex);
      chunks.push(chunk);
      children = children.slice(commaIndex + 1);
    }
    if (!chunks.length) {
      return [];
    }
    chunks.push(children);
    return chunks;
  }
  desugar_stack(children) {
    let [type, ...rest] = children;
    // children is expected to contain seq or cat as first item
    const chunks = this.split_children(rest, 'stack');
    if (!chunks.length) {
      // no stack
      return children;
    }
    // collect args of stack function
    const args = chunks.map((chunk) => {
      if (chunk.length === 1) {
        // chunks of one element can be added to the stack as is
        return chunk[0];
      } else {
        // chunks of multiple args are added to a subsequence of type
        return { type: 'list', children: [type, ...chunk] };
      }
    });
    return [{ type: 'plain', value: 'stack' }, ...args];
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
      const left = children[opIndex - 1];
      const right = children[opIndex + 1];
      if (left.type === 'pipe') {
        // "x !* 2" => (* 2 x)
        children[opIndex] = op;
        continue;
      }
      // convert infix to prefix notation
      const call = { type: 'list', children: [op, left, right] };
      // insert call while keeping other siblings
      children = [...children.slice(0, opIndex - 1), call, ...children.slice(opIndex + 2)];
      // unwrap double list.. e.g. (s jazz) * 2
      if (children.length === 1) {
        // there might be a cleaner solution
        children = children[0].children;
      }
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
        // . as lambda: (.fast 2) = x=>x.fast(2)
        // TODO: this doesn't work for (.fast 2 .speed 2)
        // probably needs proper ast representation of lambda
        children[pipeIndex] = { type: 'plain', value: '.' };
        continue;
      }
      const rightSide = children.slice(pipeIndex + 2);
      const right = children[pipeIndex + 1];
      if (right.type === 'list') {
        // apply function only to left sibling (high precedence)
        // s jazz.(fast 2) => s (fast jazz 2)
        const [callee, ...rest] = right.children;
        const leftSide = children.slice(0, pipeIndex - 1);
        const left = children[pipeIndex - 1];
        const args = [callee, left, ...rest];
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
  parse_pair(open_type, close_type) {
    this.consume(open_type);
    const children = [];
    while (this.tokens[0]?.type !== close_type) {
      children.push(this.parse_expr());
    }
    this.consume(close_type);
    return children;
  }
  parse_list() {
    let children = this.parse_pair('open_list', 'close_list');
    children = this.desugar_children(children);
    return { type: 'list', children };
  }
  parse_cat() {
    let children = this.parse_pair('open_cat', 'close_cat');
    children = [{ type: 'plain', value: 'cat' }, ...children];
    children = this.desugar_children(children);
    children = this.desugar_stack(children, 'cat');
    return { type: 'list', children };
  }
  parse_seq() {
    let children = this.parse_pair('open_seq', 'close_seq');
    children = [{ type: 'plain', value: 'seq' }, ...children];
    children = this.desugar_children(children);
    children = this.desugar_stack(children, 'seq');
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
export class UzuRunner {
  constructor(lib) {
    this.parser = new UzuParser();
    this.lib = lib;
  }
  // a helper to check conditions and throw if they are not met
  assert(condition, error) {
    if (!condition) {
      throw new Error(error);
    }
  }
  run(code) {
    const ast = this.parser.parse(code);
    return this.call(ast);
  }
  call(ast) {
    // for a node to be callable, it needs to be a list
    this.assert(ast.type === 'list', `function call: expected list, got ${ast.type}`);
    // the first element is expected to be the function name
    this.assert(ast.children[0]?.type === 'plain', `function call: expected first child to be plain, got ${ast.type}`);

    // process args
    const args = ast.children.slice(1).map((arg) => {
      if (arg.type === 'string') {
        return this.lib.string(arg.value.slice(1, -1));
      }
      if (arg.type === 'plain') {
        return this.lib.plain(arg.value);
      }
      if (arg.type === 'number') {
        return this.lib.number(Number(arg.value));
      }
      return this.call(arg);
    });

    const name = ast.children[0].value;
    if (name === '.') {
      // lambda : (.fast 2) = x=>fast(2, x)
      const callee = ast.children[1].value;
      const innerFn = this.lib[callee];
      this.assert(innerFn, `function call: unknown function name "${callee}"`);
      return (pat) => innerFn(pat, args.slice(1));
    }

    // look up function in lib
    const fn = this.lib[name];
    this.assert(fn, `function call: unknown function name "${name}"`);
    return fn(...args);
  }
}
