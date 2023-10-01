import escodegen from 'escodegen';
import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { isNoteWithOctave } from '@strudel.cycles/core';
import { getLeafLocations } from '@strudel.cycles/mini';

export function transpiler(input, options = {}) {
  const { wrapAsync = false, addReturn = true, emitMiniLocations = true, emitWidgets = true } = options;

  let ast = parse(input, {
    ecmaVersion: 2022,
    allowAwaitOutsideFunction: true,
    locations: true,
  });

  let miniLocations = [];
  const collectMiniLocations = (value, node) => {
    const leafLocs = getLeafLocations(`"${value}"`, node.start); // stimmt!
    miniLocations = miniLocations.concat(leafLocs);
  };
  let widgets = [];

  walk(ast, {
    enter(node, parent /* , prop, index */) {
      if (isBackTickString(node, parent)) {
        const { quasis } = node;
        const { raw } = quasis[0].value;
        this.skip();
        emitMiniLocations && collectMiniLocations(raw, node);
        return this.replace(miniWithLocation(raw, node));
      }
      if (isStringWithDoubleQuotes(node)) {
        const { value } = node;
        this.skip();
        emitMiniLocations && collectMiniLocations(value, node);
        return this.replace(miniWithLocation(value, node));
      }
      if (isWidgetFunction(node)) {
        emitWidgets &&
          widgets.push({
            from: node.arguments[0].start,
            to: node.arguments[0].end,
            value: node.arguments[0].raw, // don't use value!
            min: node.arguments[1]?.value ?? 0,
            max: node.arguments[2]?.value ?? 1,
          });
        return this.replace(widgetWithLocation(node));
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
    return { output };
  }
  return { output, miniLocations, widgets };
}

function isStringWithDoubleQuotes(node, locations, code) {
  if (node.type !== 'Literal') {
    return false;
  }
  return node.raw[0] === '"';
}

function isBackTickString(node, parent) {
  return node.type === 'TemplateLiteral' && parent.type !== 'TaggedTemplateExpression';
}

function miniWithLocation(value, node) {
  const { start: fromOffset } = node;
  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'm',
    },
    arguments: [
      { type: 'Literal', value },
      { type: 'Literal', value: fromOffset },
    ],
    optional: false,
  };
}

// these functions are connected to @strudel/codemirror -> slider.mjs
// maybe someday there will be pluggable transpiler functions, then move this there
function isWidgetFunction(node) {
  return node.type === 'CallExpression' && node.callee.name === 'slider';
}

function widgetWithLocation(node) {
  const id = 'slider_' + node.arguments[0].start; // use loc of first arg for id
  // add loc as identifier to first argument
  // the slider function is assumed to be slider(id, value, min?, max?)
  node.arguments.unshift({
    type: 'Literal',
    value: id,
    raw: id,
  });
  node.callee.name = 'sliderWithID';
  return node;
}
