import { parseScriptWithLocation } from './shift-parser/index.js'; // npm module does not work in the browser
import traverser from './shift-traverser/index.js'; // npm module does not work in the browser
const { replace } = traverser;
import {
  LiteralStringExpression,
  IdentifierExpression,
  CallExpression,
  StaticMemberExpression,
  Script,
} from '../_snowpack/pkg/shift-ast.js';
import codegen from '../_snowpack/pkg/shift-codegen.js';
import * as strudel from '../_snowpack/link/strudel.js';

const { Pattern } = strudel;

const isNote = (name) => /^[a-gC-G][bs]?[0-9]$/.test(name);

const addLocations = true;
export const addMiniLocations = true;

/*
not supported for highlighting:
- 'b3'.p
- mini('b3') / m('b3')
- 'b3'.m / 'b3'.mini
*/

export default (code) => {
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

      // replace template string `xxx` with 'xxx'.m
      if (isBackTickString(node)) {
        const minified = getMinified(node.elements[0].rawValue);
        return wrapLocationOffset(minified, node, ast.locations, artificialNodes);
      }

      // allows to use top level strings, which are normally directives... but we don't need directives
      if (node.type === 'Script' && node.directives.length === 1 && !node.statements.length) {
        const minified = getMinified(node.directives[0].rawValue);
        const wrapped = wrapLocationOffset(minified, node.directives[0], ast.locations, artificialNodes);
        return new Script({ directives: [], statements: [wrapped] });
      }

      // replace double quote string "xxx" with 'xxx'.m
      if (isStringWithDoubleQuotes(node, ast.locations, code)) {
        const minified = getMinified(node.value);
        return wrapLocationOffset(minified, node, ast.locations, artificialNodes);
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
      if (node.type === 'CallExpression' && node.callee.name === 'pure') {
        const literal = node.arguments[0];
        // const value = literal[{ LiteralNumericExpression: 'value', LiteralStringExpression: 'name' }[literal.type]];
        // console.log('value',value);
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
      if (addLocations && node.type === 'LiteralStringExpression' && isMarkable) {
        // console.log('add', node);
        return reifyWithLocation(node, node, ast.locations, artificialNodes);
      }
      if (!addMiniLocations) {
        return wrapFunction('reify', node);
      }
      // mini notation location handling
      const miniFunctions = ['mini', 'm'];
      const isAlreadyWrapped = parent?.type === 'CallExpression' && parent.callee.name === 'withLocationOffset';
      if (node.type === 'CallExpression' && miniFunctions.includes(node.callee.name) && !isAlreadyWrapped) {
        // mini('c3')
        if (node.arguments.length > 1) {
          // TODO: transform mini(...args) to cat(...args.map(mini)) ?
          console.warn('multi arg mini locations not supported yet...');
          return node;
        }
        return wrapLocationOffset(node, node.arguments, ast.locations, artificialNodes);
      }
      if (node.type === 'StaticMemberExpression' && miniFunctions.includes(node.property) && !isAlreadyWrapped) {
        // 'c3'.mini or 'c3'.m
        return wrapLocationOffset(node, node.object, ast.locations, artificialNodes);
      }
      return node;
    },
    leave() {
      parents.pop();
    },
  });
  return codegen(shifted);
};

function wrapFunction(name, ...args) {
  return new CallExpression({
    callee: new IdentifierExpression({ name }),
    arguments: args,
  });
}

function getMinified(value) {
  return new StaticMemberExpression({
    object: new LiteralStringExpression({ value }),
    property: 'm',
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

function isPatternFactory(node) {
  return node?.type === 'CallExpression' && Object.keys(Pattern.prototype.factories).includes(node.callee.name);
}

function canBeOverloaded(node) {
  return (node.type === 'IdentifierExpression' && isNote(node.name)) || isPatternFactory(node);
  // TODO: support sequence(c3).transpose(3).x.y.z
}

// turn node into withLocationOffset(node, location)
function wrapLocationOffset(node, stringNode, locations, artificialNodes) {
  // console.log('wrapppp', stringNode);
  const expression = {
    type: 'CallExpression',
    callee: {
      type: 'IdentifierExpression',
      name: 'withLocationOffset',
    },
    arguments: [node, getLocationObject(stringNode, locations)],
  };
  artificialNodes.push(expression);
  // console.log('wrapped', codegen(expression));
  return expression;
}

// turns node in reify(value).withLocation(location), where location is the node's location in the source code
// with this, the reified pattern can pass its location to the event, to know where to highlight when it's active
function reifyWithLocation(literalNode, node, locations, artificialNodes) {
  const withLocation = new CallExpression({
    callee: new StaticMemberExpression({
      object: wrapFunction('reify', literalNode),
      property: 'withLocation',
    }),
    arguments: [getLocationObject(node, locations)],
  });
  artificialNodes.push(withLocation);
  return withLocation;
}

// returns ast for source location object
function getLocationObject(node, locations) {
  /*const locationAST = parseScript(
    "x=" + JSON.stringify(ast.locations.get(node))
  ).statements[0].expression.expression;

  console.log("locationAST", locationAST);*/

  /*const callAST = parseScript(
    `reify(${node.name}).withLocation(${JSON.stringify(
      ast.locations.get(node)
    )})`
  ).statements[0].expression;*/
  const loc = locations.get(node);
  return {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'DataProperty',
        name: {
          type: 'StaticPropertyName',
          value: 'start',
        },
        expression: {
          type: 'ObjectExpression',
          properties: [
            {
              type: 'DataProperty',
              name: {
                type: 'StaticPropertyName',
                value: 'line',
              },
              expression: {
                type: 'LiteralNumericExpression',
                value: loc.start.line,
              },
            },
            {
              type: 'DataProperty',
              name: {
                type: 'StaticPropertyName',
                value: 'column',
              },
              expression: {
                type: 'LiteralNumericExpression',
                value: loc.start.column,
              },
            },
            {
              type: 'DataProperty',
              name: {
                type: 'StaticPropertyName',
                value: 'offset',
              },
              expression: {
                type: 'LiteralNumericExpression',
                value: loc.start.offset,
              },
            },
          ],
        },
      },
      {
        type: 'DataProperty',
        name: {
          type: 'StaticPropertyName',
          value: 'end',
        },
        expression: {
          type: 'ObjectExpression',
          properties: [
            {
              type: 'DataProperty',
              name: {
                type: 'StaticPropertyName',
                value: 'line',
              },
              expression: {
                type: 'LiteralNumericExpression',
                value: loc.end.line,
              },
            },
            {
              type: 'DataProperty',
              name: {
                type: 'StaticPropertyName',
                value: 'column',
              },
              expression: {
                type: 'LiteralNumericExpression',
                value: loc.end.column,
              },
            },
            {
              type: 'DataProperty',
              name: {
                type: 'StaticPropertyName',
                value: 'offset',
              },
              expression: {
                type: 'LiteralNumericExpression',
                value: loc.end.offset,
              },
            },
          ],
        },
      },
    ],
  };
}
