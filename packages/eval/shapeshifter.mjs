/*
shapeshifter.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/eval/shapeshifter.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* import { parseScriptWithLocation } from './shift-parser/index.js'; // npm module does not work in the browser
import traverser from './shift-traverser/index.js'; // npm module does not work in the browser */
import { parseScriptWithLocation } from 'shift-parser';
import traverser from './shift-traverser/index.js';
const { replace } = traverser;
import {
  LiteralStringExpression,
  IdentifierExpression,
  CallExpression,
  StaticMemberExpression,
  ReturnStatement,
  ArrayExpression,
  LiteralNumericExpression,
} from 'shift-ast';
import shiftCodegen from 'shift-codegen';
const codegen = shiftCodegen.default || shiftCodegen; // parcel module resolution fuckup

import * as strudel from '@strudel.cycles/core';

const { Pattern } = strudel;

const isNote = (name) => /^[a-gC-G][bs]?[0-9]$/.test(name);

const addLocations = true;
export const addMiniLocations = true;
export const minifyStrings = true;
export const wrappedAsync = true;

export default (_code) => {
  const { code, addReturn } = wrapAsync(_code);
  const ast = parseScriptWithLocation(code);
  const artificialNodes = [];
  const parents = [];
  const shifted = replace(ast.tree, {
    enter(node, parent) {
      parents.push(parent);
      const isSynthetic = parents.some((p) => artificialNodes.includes(p));
      if (isSynthetic) {
        return node;
      }

      // replace template string `xxx` with mini(`xxx`)
      if (minifyStrings && isBackTickString(node)) {
        return minifyWithLocation(node, node, ast.locations, artificialNodes);
      }
      // allows to use top level strings, which are normally directives... but we don't need directives
      if (minifyStrings && node.directives?.length === 1 && !node.statements?.length) {
        const str = new LiteralStringExpression({ value: node.directives[0].rawValue });
        const wrapped = minifyWithLocation(str, node.directives[0], ast.locations, artificialNodes);
        return { ...node, directives: [], statements: [wrapped] };
      }

      // replace double quote string "xxx" with mini('xxx')
      if (minifyStrings && isStringWithDoubleQuotes(node, ast.locations, code)) {
        return minifyWithLocation(node, node, ast.locations, artificialNodes);
      }

      // operator overloading => still not done
      const operators = {
        '*': 'fast',
        '/': 'slow',
        '&': 'stack',
        '&&': 'append',
      };
      if (
        node.type === 'BinaryExpression' &&
        operators[node.operator] &&
        ['LiteralNumericExpression', 'LiteralStringExpression', 'IdentifierExpression'].includes(node.right?.type) &&
        canBeOverloaded(node.left)
      ) {
        let arg = node.left;
        if (node.left.type === 'IdentifierExpression') {
          arg = wrapFunction('reify', node.left);
        }
        return new CallExpression({
          callee: new StaticMemberExpression({
            property: operators[node.operator],
            object: wrapFunction('reify', arg),
          }),
          arguments: [node.right],
        });
      }

      const isMarkable = isPatternArg(parents) || hasModifierCall(parent);
      // add to location to pure(x) calls
      if (addLocations && node.type === 'CallExpression' && node.callee.name === 'pure') {
        const literal = node.arguments[0];
        // const value = literal[{ LiteralNumericExpression: 'value', LiteralStringExpression: 'name' }[literal.type]];
        return reifyWithLocation(literal, node.arguments[0], ast.locations, artificialNodes);
      }
      // replace pseudo note variables
      if (node.type === 'IdentifierExpression') {
        if (isNote(node.name)) {
          const value = node.name[1] === 's' ? node.name.replace('s', '#') : node.name;
          if (addLocations && isMarkable) {
            return reifyWithLocation(new LiteralStringExpression({ value }), node, ast.locations, artificialNodes);
          }
          return new LiteralStringExpression({ value });
        }
        if (node.name === 'r') {
          return new IdentifierExpression({ name: 'silence' });
        }
      }
      if (
        addLocations &&
        ['LiteralStringExpression' /* , 'LiteralNumericExpression' */].includes(node.type) &&
        isMarkable
      ) {
        // TODO: to make LiteralNumericExpression work, we need to make sure we're not inside timeCat...
        return reifyWithLocation(node, node, ast.locations, artificialNodes);
      }
      if (addMiniLocations) {
        return addMiniNotationLocations(node, ast.locations, artificialNodes);
      }
      return node;
    },
    leave() {
      parents.pop();
    },
  });
  // add return to last statement (because it's wrapped in an async function artificially)
  if (wrappedAsync) {
    addReturn(shifted);
  }
  const generated = codegen(shifted);
  return generated;
};

function wrapAsync(code) {
  // wrap code in async to make await work on top level => this will create 1 line offset to locations
  // this is why line offset is -1 in getLocationObject calls below
  if (wrappedAsync) {
    code = `(async () => {
${code}
})()`;
  }
  const addReturn = (ast) => {
    const body = ast.statements[0].expression.callee.body; // actual code ast inside async function body
    body.statements = body.statements
      .slice(0, -1)
      .concat([new ReturnStatement({ expression: body.statements.slice(-1)[0] })]);
  };
  return {
    code,
    addReturn,
  };
}

function addMiniNotationLocations(node, locations, artificialNodes) {
  const miniFunctions = ['mini', 'm'];
  // const isAlreadyWrapped = parent?.type === 'CallExpression' && parent.callee.name === 'withLocationOffset';
  if (node.type === 'CallExpression' && miniFunctions.includes(node.callee.name)) {
    // mini('c3')
    if (node.arguments.length > 1) {
      // TODO: transform mini(...args) to cat(...args.map(mini)) ?
      console.warn('multi arg mini locations not supported yet...');
      return node;
    }
    const str = node.arguments[0];
    return minifyWithLocation(str, str, locations, artificialNodes);
  }
  if (node.type === 'StaticMemberExpression' && miniFunctions.includes(node.property)) {
    // 'c3'.mini or 'c3'.m
    return minifyWithLocation(node.object, node, locations, artificialNodes);
  }
  return node;
}

function wrapFunction(name, ...args) {
  return new CallExpression({
    callee: new IdentifierExpression({ name }),
    arguments: args,
  });
}

function isBackTickString(node) {
  return node.type === 'TemplateExpression' && node.elements.length === 1;
}

function isStringWithDoubleQuotes(node, locations, code) {
  if (node.type !== 'LiteralStringExpression') {
    return false;
  }
  const loc = locations.get(node);
  const snippet = code.slice(loc.start.offset, loc.end.offset);
  return snippet[0] === '"'; // we can trust the end is also ", as the parsing did not fail
}

// returns true if the given parents belong to a pattern argument node
// this is used to check if a node should receive a location for highlighting
function isPatternArg(parents) {
  if (!parents.length) {
    return false;
  }
  const ancestors = parents.slice(0, -1);
  const parent = parents[parents.length - 1];
  if (isPatternFactory(parent)) {
    return true;
  }
  if (parent?.type === 'ArrayExpression') {
    return isPatternArg(ancestors);
  }
  return false;
}

function hasModifierCall(parent) {
  // TODO: modifiers are more than composables, for example every is not composable but should be seen as modifier..
  // need all prototypes of Pattern
  return (
    parent?.type === 'StaticMemberExpression' && Object.keys(Pattern.prototype.composable).includes(parent.property)
  );
}
const factories = Object.keys(Pattern.prototype.factories).concat(['mini']);

function isPatternFactory(node) {
  return node?.type === 'CallExpression' && factories.includes(node.callee.name);
}

function canBeOverloaded(node) {
  return (node.type === 'IdentifierExpression' && isNote(node.name)) || isPatternFactory(node);
  // TODO: support sequence(c3).transpose(3).x.y.z
}

// turns node in reify(value).withLocation(location), where location is the node's location in the source code
// with this, the reified pattern can pass its location to the event, to know where to highlight when it's active
function reifyWithLocation(literalNode, node, locations, artificialNodes) {
  const args = getLocationArguments(node, locations);
  const withLocation = new CallExpression({
    callee: new StaticMemberExpression({
      object: wrapFunction('reify', literalNode),
      property: 'withLocation',
    }),
    arguments: args,
  });
  artificialNodes.push(withLocation);
  return withLocation;
}

// turns node in reify(value).withLocation(location), where location is the node's location in the source code
// with this, the reified pattern can pass its location to the event, to know where to highlight when it's active
function minifyWithLocation(literalNode, node, locations, artificialNodes) {
  const args = getLocationArguments(node, locations);
  const wrapped = wrapFunction('mini', literalNode);
  if (!addMiniLocations) {
    artificialNodes.push(wrapped);
    return wrapped;
  }
  const withLocation = new CallExpression({
    callee: new StaticMemberExpression({
      object: wrapped,
      property: 'withMiniLocation',
    }),
    arguments: args,
  });
  artificialNodes.push(withLocation);
  return withLocation;
}

function getLocationArguments(node, locations) {
  const loc = locations.get(node);
  const lineOffset = wrappedAsync ? -1 : 0;
  return [
    new ArrayExpression({
      elements: [
        new LiteralNumericExpression({ value: loc.start.line + lineOffset }), // the minus 1 assumes the code has been wrapped in async iife
        new LiteralNumericExpression({ value: loc.start.column }),
        new LiteralNumericExpression({ value: loc.start.offset }),
      ],
    }),
    new ArrayExpression({
      elements: [
        new LiteralNumericExpression({ value: loc.end.line + lineOffset }), // the minus 1 assumes the code has been wrapped in async iife
        new LiteralNumericExpression({ value: loc.end.column }),
        new LiteralNumericExpression({ value: loc.end.offset }),
      ],
    }),
  ];
}
