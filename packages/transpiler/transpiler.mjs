import escodegen from 'escodegen';
import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { isNoteWithOctave } from '@strudel.cycles/core';
import { getLeafLocations } from '@strudel.cycles/mini';

export function transpiler(input, options = {}) {
  const { wrapAsync = false, addReturn = true, simpleLocs = false, emitMiniLocations = false } = options;

  let ast = parse(input, {
    ecmaVersion: 2022,
    allowAwaitOutsideFunction: true,
    locations: true,
  });

  let miniLocations = [];
  const collectMiniLocations = (value, node) => {
    const leafLocs = getLeafLocations(`"${value}"`);
    const withOffset = leafLocs.map((offsets) => offsets.map((o) => o + node.start));
    miniLocations = miniLocations.concat(withOffset);
  };

  walk(ast, {
    enter(node, parent /* , prop, index */) {
      if (isBackTickString(node, parent)) {
        const { quasis } = node;
        const { raw } = quasis[0].value;
        this.skip();
        emitMiniLocations && collectMiniLocations(raw, node);
        return this.replace(miniWithLocation(raw, node, simpleLocs, miniLocations));
      }
      if (isStringWithDoubleQuotes(node)) {
        const { value } = node;
        this.skip();
        emitMiniLocations && collectMiniLocations(value, node);
        return this.replace(miniWithLocation(value, node, simpleLocs, miniLocations));
      }
      // TODO: remove pseudo note variables?
      if (node.type === 'Identifier' && isNoteWithOctave(node.name)) {
        this.skip();
        return this.replace({ type: 'Literal', value: node.name });
      }
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
  let output = escodegen.generate(ast);
  if (wrapAsync) {
    output = `(async ()=>{${output}})()`;
  }
  if (!emitMiniLocations) {
    return output;
  }
  return { output, miniLocations };
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

function miniWithLocation(value, node, simpleLocs) {
  let locs;
  const { start: fromOffset, end: toOffset } = node;
  if (simpleLocs) {
    locs = [
      {
        type: 'Literal',
        value: fromOffset,
      },
      {
        type: 'Literal',
        value: toOffset,
      },
    ];
  } else {
    const {
      loc: {
        start: { line: fromLine, column: fromColumn },
        end: { line: toLine, column: toColumn },
      },
    } = node;
    locs = [
      {
        type: 'ArrayExpression',
        elements: [fromLine, fromColumn, fromOffset].map((value) => ({
          type: 'Literal',
          value,
        })),
      },
      {
        type: 'ArrayExpression',
        elements: [toLine, toColumn, toOffset].map((value) => ({
          type: 'Literal',
          value,
        })),
      },
    ];
  }
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
    arguments: locs,
    optional: false,
  };
}
