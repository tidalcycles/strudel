import { parseScriptWithLocation } from './shift-parser/index.js'; // npm module does not work in the browser
import traverser from './shift-traverser'; // npm module does not work in the browser
const { replace } = traverser;
import { LiteralStringExpression, IdentifierExpression, CallExpression, StaticMemberExpression } from 'shift-ast';
import codegen from 'shift-codegen';
import * as strudel from '../../strudel.mjs';

const { Pattern } = strudel;

const isNote = (name) => /^[a-gC-G][bs]?[0-9]$/.test(name);

const addLocations = true;
export const addMiniLocations = true;

export default (code) => {
  const ast = parseScriptWithLocation(code);
  const nodesWithLocation = [];
  const parents = [];
  const shifted = replace(ast.tree, {
    enter(node, parent) {
      parents.push(parent);
      const isSynthetic = parents.some((p) => nodesWithLocation.includes(p));
      if (isSynthetic) {
        return node;
      }
      const grandparent = parents[parents.length - 2];
      const isTimeCat = parent?.type === 'ArrayExpression' && isPatternFactory(grandparent);
      const isMarkable = isPatternFactory(parent) || isTimeCat;
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
          arg = wrapReify(node.left);
        }
        return new CallExpression({
          callee: new StaticMemberExpression({
            property: operators[node.operator],
            object: wrapReify(arg),
          }),
          arguments: [node.right],
        });
      }
      // replace pseudo note variables
      if (node.type === 'IdentifierExpression') {
        if (isNote(node.name)) {
          const value = node.name[1] === 's' ? node.name.replace('s', '#') : node.name;
          if (addLocations && isMarkable) {
            return reifyWithLocation(value, node, ast.locations, nodesWithLocation);
          }
          return new LiteralStringExpression({ value });
        }
        if (node.name === 'r') {
          return new IdentifierExpression({ name: 'silence' });
        }
      }
      if (addLocations && node.type === 'LiteralStringExpression' && isMarkable) {
        // console.log('add', node);
        return reifyWithLocation(node.value, node, ast.locations, nodesWithLocation);
      }
      if (!addMiniLocations) {
        return node;
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
        return wrapLocationOffset(node, node.arguments, ast.locations, nodesWithLocation);
      }
      if (node.type === 'StaticMemberExpression' && miniFunctions.includes(node.property) && !isAlreadyWrapped) {
        // 'c3'.mini or 'c3'.m
        return wrapLocationOffset(node, node.object, ast.locations, nodesWithLocation);
      }
      return node;
    },
    leave() {
      parents.pop();
    },
  });
  return codegen(shifted);
};

function wrapReify(node) {
  return new CallExpression({
    callee: new IdentifierExpression({
      name: 'reify',
    }),
    arguments: [node],
  });
}

function isPatternFactory(node) {
  return node?.type === 'CallExpression' && Object.keys(Pattern.prototype.factories).includes(node.callee.name);
}

function canBeOverloaded(node) {
  return (node.type === 'IdentifierExpression' && isNote(node.name)) || isPatternFactory(node);
  // TODO: support sequence(c3).transpose(3).x.y.z
}

// turn node into withLocationOffset(node, location)
function wrapLocationOffset(node, stringNode, locations, nodesWithLocation) {
  // console.log('wrapppp', stringNode);
  const expression = {
    type: 'CallExpression',
    callee: {
      type: 'IdentifierExpression',
      name: 'withLocationOffset',
    },
    arguments: [node, getLocationObject(stringNode, locations)],
  };
  nodesWithLocation.push(expression);
  // console.log('wrapped', codegen(expression));
  return expression;
}

// turns node in reify(value).withLocation(location), where location is the node's location in the source code
// with this, the reified pattern can pass its location to the event, to know where to highlight when it's active
function reifyWithLocation(value, node, locations, nodesWithLocation) {
  // console.log('reifyWithLocation', value, node);
  const withLocation = new CallExpression({
    callee: new StaticMemberExpression({
      object: new CallExpression({
        callee: new IdentifierExpression({
          name: 'reify',
        }),
        arguments: [new LiteralStringExpression({ value })],
      }),
      property: 'withLocation',
    }),
    arguments: [getLocationObject(node, locations)],
  });
  nodesWithLocation.push(withLocation);
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

// TODO: turn x.groove['[~ x]*2'] into x.groove('[~ x]*2'.m)
// and ['c1*2'].xx into 'c1*2'.m.xx ??
// or just all templated strings?? x.groove(`[~ x]*2`)
