import { parse } from './parser.mjs';

function runApply(node, scope, ops) {
  if (node.children.length !== 2)
    throw new Error(`expected 2 children for node type apply, got ${node.children.length}`);
  const [fn, arg] = node.children.map((child) => run(child, scope, ops));
  if (typeof fn !== 'function') {
    throw new Error(`${node.children[0].text} is not a function`);
  }
  // only works if fn is curried!
  return fn(arg);
}

function runInfix(left, symbol, right, ops) {
  const customOp = ops[symbol];
  if (customOp) {
    return customOp(left, right);
  }
  switch (symbol) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    case '$':
      return left(right);
    case '&':
      console.log('right', right);
      return right(left);
    case '.':
      return (x) => left(right(x));
    default:
      throw new Error('unexpected infix operator ' + symbol);
  }
}

function curry(patterns, body, scope, ops) {
  const [variable, ...rest] = patterns;
  return (arg) => {
    let _scope = { ...scope, [variable.text]: arg };
    if (patterns.length === 1) {
      const result = run(body, _scope, ops);
      return result;
    }
    return curry(rest, body, _scope, ops);
  };
}

export function run(node, scope, ops = {}) {
  let runInScope = (node, scp = scope) => run(node, scp, ops);
  //console.log("node", node.type, node.text);
  if (ops[node.type]) {
    return ops[node.type](node);
  }
  switch (node.type) {
    case 'ERROR':
      throw new Error(`invalid syntax: "${node.text}"`);
    case 'declarations':
      let result;
      node.children.forEach((declaration) => {
        result = runInScope(declaration);
      });
      return result;
    case 'integer':
      return Number(node.text);
    case 'float':
      return Number(node.text);
    case 'string':
      const str = node.text.slice(1, -1);
      return String(str);
    case 'lambda':
      const [_, lpatterns, __, lbody] = node.children;
      return curry(lpatterns.children, lbody, scope, ops);
    case 'function':
      const [fvariable, fpatterns, fbody] = node.children;
      scope[fvariable.text] = curry(fpatterns.children, fbody, scope, ops);
      return scope[fvariable.text];
    case 'list': {
      return node.children
        .filter((_, i) => i % 2 === 1) // elements are at odd indices
        .map((node) => runInScope(node));
    }
    case 'match':
      if (node.children[0].text !== '=' || node.children.length !== 2) {
        throw new Error('match node so far only support simple assignments');
      }
      return runInScope(node.children[1]);
    case 'bind':
      if (node.children.length !== 2) throw new Error('expected 2 children for node type bind');
      if (node.children[0].type !== 'variable') throw new Error('expected variable as first child of bind node');
      if (node.children[1].type !== 'match') throw new Error('expected match as first child of bind node');
      const [bvariable, bmatch] = node.children;
      const value = runInScope(bmatch);
      scope[bvariable.text] = value;
      return value;
    case 'variable':
      return scope[node.text];
    case 'infix': {
      const [a, op, b] = node.children;
      const symbol = op.text;
      const [left, right] = [runInScope(a), runInScope(b)];
      return runInfix(left, symbol, right, ops);
    }
    case 'apply':
      return runApply(node, scope, ops);
    case 'left_section': {
      const [_, b, op] = node.children;
      const right = runInScope(b);
      return (left) => runInfix(left, op.text, right, ops);
    }
    case 'right_section': {
      const [_, op, b] = node.children;
      const right = runInScope(b);
      return (left) => runInfix(left, op.text, right, ops);
    }
    case 'parens':
      if (node.children.length !== 3) throw new Error('expected 3 children for node type parens');
      return runInScope(node.children[1]);
    default:
      if (node.children.length === 0) {
        throw new Error('unhandled leaf type ' + node.type);
      }
      if (node.children.length > 1) {
        throw new Error('unhandled branch type ' + node.type);
      }
      return runInScope(node.children[0]);
  }
}

export function evaluate(haskellCode, scope = globalThis, ops) {
  const ast = parse(haskellCode);
  return run(ast.rootNode, scope, ops);
}
