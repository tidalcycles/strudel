import escodegen from 'escodegen';
import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { isNote } from '@strudel.cycles/core';

export function transpiler(input, options = {}) {
  const { wrapAsync = true, addReturn = true } = options;

  let ast = parse(input, {
    ecmaVersion: 2022,
    allowAwaitOutsideFunction: true,
    // locations: true,
  });

  walk(ast, {
    enter(node, parent, prop, index) {
      if (isBackTickString(node, parent)) {
        const { quasis, start, end } = node;
        const { raw } = quasis[0].value;
        this.skip();
        return this.replace(miniWithLocation(raw, start, end));
      }
      if (isStringWithDoubleQuotes(node)) {
        const { value, start, end } = node;
        this.skip();
        return this.replace(miniWithLocation(value, start, end));
      }
      if (node.type === 'Identifier' && isNote(node.name)) {
        this.skip();
        return this.replace({ type: 'Literal', value: node.name });
      }
      // TODO:
    },
    leave(node, parent, prop, index) {},
  });

  const { body } = ast;
  if (!body?.[body.length - 1]?.expression) {
    throw new Error('unexpected ast format without body expression');
  }

  // add return to last statement
  if (addReturn) {
    const { expression } = body[body.length - 1];
    body[body.length - 1] = {
      type: 'ReturnStatement',
      argument: expression,
    };
  }
  const output = escodegen.generate(ast);
  if (wrapAsync) {
    return `(async ()=>{${output}})()`;
  }
  return output;
}

function isStringWithDoubleQuotes(node, locations, code) {
  const { raw, type } = node;
  if (type !== 'Literal') {
    return false;
  }
  return raw[0] === '"';
}

function isBackTickString(node, parent) {
  return node.type === 'TemplateLiteral' && parent.type !== 'TaggedTemplateExpression';
}

function miniWithLocation(value, start, end) {
  // with location
  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'mini',
        },
        arguments: [{ type: 'Literal', value }],
        optional: false,
      },
      property: {
        type: 'Identifier',
        name: 'withMiniLocation',
      },
    },
    arguments: [
      {
        type: 'Literal',
        value: start,
      },
      {
        type: 'Literal',
        value: end,
      },
    ],
    optional: false,
  };
}
