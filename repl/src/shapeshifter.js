import { parseScriptWithLocation } from './shift-parser/index.js'; // npm module does not work in the browser
import traverser from './shift-traverser'; // npm module does not work in the browser
const { replace } = traverser;
import { LiteralStringExpression, IdentifierExpression, CallExpression, StaticMemberExpression } from 'shift-ast';
import codegen from 'shift-codegen';
import * as strudel from '../../strudel.mjs';

const { Pattern } = strudel;

const isNote = (name) => /^[a-gC-G][bs]?[0-9]$/.test(name);

const addLocations = true;

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
      const isPatternArg = (parent) =>
        parent?.type === 'CallExpression' && Object.keys(Pattern.prototype.factories).includes(parent.callee.name);
      const isTimeCat = parent?.type === 'ArrayExpression' && isPatternArg(grandparent);
      const isMarkable = isPatternArg(parent) || isTimeCat;
      // replace pseudo note variables
      if (node.type === 'IdentifierExpression') {
        if (isNote(node.name)) {
          const value = node.name[1] === 's' ? node.name.replace('s', '#') : node.name;
          if (addLocations && isMarkable) {
            return addPureWithLocation(value, node, ast.locations, nodesWithLocation);
          }
          return new LiteralStringExpression({ value });
        }
        if (node.name === 'r') {
          return new IdentifierExpression({ name: 'silence' });
        }
      }
      if (addLocations && node.type === 'LiteralStringExpression' && isMarkable) {
        // console.log('add', node);
        return addPureWithLocation(node.value, node, ast.locations, nodesWithLocation);
      }
      return node;
    },
    leave() {
      parents.pop();
    },
  });
  return codegen(shifted);
};

// turns node in pure(value).withLocation(location), where location is the node's location in the source code
// with this, the pure pattern can pass its location to the event, to know where to highlight when it's active
function addPureWithLocation(value, node, locations, nodesWithLocation) {
  // console.log('addPure', value, node);
  const withLocation = new CallExpression({
    callee: new StaticMemberExpression({
      object: new CallExpression({
        callee: new IdentifierExpression({
          name: 'pure',
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
    `pure(${node.name}).withLocation(${JSON.stringify(
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
