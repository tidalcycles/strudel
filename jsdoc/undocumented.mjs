import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'acorn';
import dependencyTree from 'dependency-tree';
const __dirname = dirname(fileURLToPath(import.meta.url));

function getExports(code) {
  // parse it with acorn
  let ast;
  try {
    ast = parse(code, {
      ecmaVersion: 11,
      sourceType: 'module',
    });
  } catch (err) {
    return [`acorn parse error: ${err.name}: ${err.messsage}`];
  }

  // find all names exported in the file
  return ast.body
    .filter((node) => node?.type === 'ExportNamedDeclaration')
    .map((node) => {
      const { declaration } = node;
      if (!declaration) {
        // e.g. "export { Fraction, controls }"
        return [];
      }
      switch (declaration.type) {
        case 'VariableDeclaration':
          return declaration.declarations
            .map((d) => {
              switch (d.id.type) {
                case 'Identifier':
                  return d.id.name;
                case 'ObjectPattern':
                  return d.id.properties.map((p) => p.value.name);
                default:
                  return 'unknown declaration: ' + declaration;
              }
            })
            .flat();
        default:
          // FunctionDeclaration, ClassDeclaration
          return declaration.id.name;
      }
    })
    .flat();
}

function isDocumented(name, docs) {
  return docs.find(
    (d) => d.name === name || d.tags?.find((t) => t.title === 'synonyms' && t.value.split(', ').includes(name)),
  );
}

async function getUndocumented(path, docs) {
  try {
    // load the code of pattern.mjs as a string
    const code = await readFile(path, 'utf8');
    return getExports(code).filter((name) => !isDocumented(name, docs));
  } catch (err) {
    return [`parse error: ${err.name}: ${err.message}`];
  }
}

// read doc.json file
const { docs } = JSON.parse(await readFile(resolve(__dirname, '..', 'doc.json'), 'utf8'));

const paths = dependencyTree.toList({
  filename: 'index.mjs',
  // filename: 'packages/core/index.mjs',
  directory: resolve(__dirname),
  filter: (path) => !path.includes('node_modules'),
});
// const paths = ['../packages/core/pattern.mjs', '../packages/core/hap.mjs'].map((rel) => resolve(__dirname, rel));

const undocumented = Object.fromEntries(
  await Promise.all(
    paths.map(async (path) => [path.replace(resolve(__dirname, '..'), ''), await getUndocumented(path, docs)]),
  ),
);

console.log(JSON.stringify(undocumented, null, 2));
