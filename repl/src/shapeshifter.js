import { parseScript } from './shift-parser/index.js'; // npm module does not work in the browser
import traverser from './shift-traverser'; // npm module does not work in the browser
const { replace } = traverser;
import { LiteralStringExpression, IdentifierExpression } from 'shift-ast';
import codegen from 'shift-codegen';

const isNote = (name) => /^[a-gC-G][bs]?[0-9]$/.test(name);

export default (code) => {
  const ast = parseScript(code);
  const shifted = replace(ast, {
    enter(node, parent) {
      // replace identifiers that are a note with a note string
      if (node.type === 'IdentifierExpression') {
        if (isNote(node.name)) {
          const value = node.name[1] === 's' ? node.name.replace('s', '#') : node.name;
          return new LiteralStringExpression({ value });
        }
        if (node.name === 'r') {
          return new IdentifierExpression({ name: 'silence' });
        }
      }
    },
  });
  return codegen(shifted);
};
